'use strict';

var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var istanbul = require('gulp-istanbul');
var sourcemaps = require('gulp-sourcemaps');
var remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');

function compileTypescript(done) {
  require('child_process').exec('tsc -p ' + process.cwd(), function (err, stdout, stderr) {
    err && console.error(err);
    console.log(stdout.toString());
    console.error(stderr.toString());
    done(err);
  });
}

function compileTypescriptIgnoreError() {
  require('child_process').exec('tsc -p ' + process.cwd() + ' --noEmitOnError', function (err, stdout, stderr) {
    err && console.error(err);
    console.log(stdout.toString());
    console.error(stderr.toString());
  });
}

function watch() {
  gulp.watch(['./src/**/*.ts'], ['buildIgnoreError']);
}

function clean(done) {
  var del = require('del');
  del(['./dist', './node_modules'], done);
}

function preIstanbulTask() {
  return gulp.src(['dist/**/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
}

function istanbulTask() {
  return gulp.src(['dist/spec/*.js'])
    .pipe(jasmine())
    .pipe(istanbul.writeReports());
}

function remapIstanbulTask() {
  return gulp.src('coverage/coverage-final.json')
    .pipe(remapIstanbul({
      reports: {
        html: 'coverage/remap-report',
        'lcovonly': 'coverage/lcov-remap.info'
      }
    }));
}

gulp.task('build',            compileTypescript);
gulp.task('buildIgnoreError', compileTypescriptIgnoreError);
gulp.task('watch', watch);
gulp.task('clean', clean);
gulp.task('pre-coverage', ['build'], preIstanbulTask);
gulp.task('coverage-js', ['pre-coverage'], istanbulTask);
gulp.task('coverage', ['coverage-js'], remapIstanbulTask);
