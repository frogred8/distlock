import _ = require('lodash');
import Promise = require('bluebird');
import redis = require('redis');
import { DistLock } from '../distlock';

var client: redis.RedisClient;
var get = Promise.promisify((k, c: (err, result) => void) => client.get(k, c));

const [host, port] = (process.env.REDIS_HOST || '192.168.99.100:6379').split(':');

describe('test lock', () => {
  beforeAll(done => {
    client = redis.createClient(port || 6379, host);
    client.once('connect', done);
    client.once('error', done);
  });

  it('should lock and unlock', done => {
    var key = 'edge1';
    var l = new DistLock(client, key);
    l.lock()
      .then(() => get(key))
      .then(value  => {
        console.log('test1: get', key, value);
        expect(value).not.toBeUndefined();
      })
      .catch(done)
      .finally(() => l.unlock())
      .then(() => get(key))
      .then(v => {
        expect(v).toBeNull();
      })
      .then(done);
  });

  it('should mutually exclusive with same key', done => {
    var state;
    var testPromise = () => {
      var l = new DistLock(client, 'edge2');
      return l.lock()
        .then(() => {
          expect(state).not.toBe('locked');
          state = 'locked';
          console.log('test2: state =', state);
        })
        .delay(Math.random() * 200)
        .then(() => {
          state = undefined;
          console.log('test2: state =', state);
        })
        .finally(() => l.unlock());
    };
    Promise.all(_.range(0, 10).map(() => testPromise())).then(done);
  });

  it('should fail by locking same lock object', done => {
    var l = new DistLock(client, 'edge3');
    l.lock()
      .then(() => l.lock())
      .then(() => expect(true).toBe(false))
      .catch(e => {
        console.log('test3: throws', e);
        expect(e.message).toBe('lock: duplicated')
      })
      .finally(() => l.unlock())
      .then(done);
  });
});
