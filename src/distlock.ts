import 'source-map-support/register'
import Promise = require('bluebird');
import redis = require('redis');
import uuid = require('node-uuid');
import fs = require('fs');

export class DistLock implements Lock {

  private id: string;
  private script: string;
  private locked: boolean;

  constructor(private redisClient: redis.RedisClient,
              private key: string) {
  }

  public lock(option?: LockOption) {
    if (this.locked) {
      return Promise.reject<DistLock>(new Error('lock: duplicated'));
    }
    this.locked = true;
    this.id = uuid.v4();
    option = option || {};

    var deferred = Promise.defer<DistLock>();
    var retry = 0;
    var tryLock = () => {
      this.redisClient.set(this.key, this.id, 'PX', option.ttl || 15000, 'NX', (err, locked) => {
        if (err) return deferred.reject(err);
        if (locked) {
          return deferred.resolve(this);
        } else {
          if (++retry > (option.retryLimit || 100)) {
            return deferred.reject(new Error('lock: exceeds retry count'));
          }
          setTimeout(tryLock, option.retryDelay || 100);
        }
      });
    };
    tryLock();
    return deferred.promise;
  }

  public unlock() {
    if (!this.script) {
      this.script = fs.readFileSync(__dirname + '/../lua/unlock.lua').toString();
    }
    var deferred = Promise.defer<number>();
    this.redisClient.eval(this.script, 1, this.key, this.id, (err, unlocked: number) => {
      if (err) return deferred.reject(err);
      this.locked = false;
      return deferred.resolve(unlocked);
    });
    return deferred.promise;
  }
}

export interface LockOption {
  ttl?: number;
  retryLimit?: number;
  retryDelay?: number;
}

export interface Lock {
  lock: (option?: LockOption) => Promise<Lock>;
  unlock: () => Promise<any>;
}
