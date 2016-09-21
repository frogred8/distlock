'use strict';

var gulp = require('gulp');

function compileTypescript() {
  require('child_process').exec('tsc -p ' + process.cwd(), function (err, stdout, stderr) {
    err && console.error(err);
    console.log(stdout.toString());
    console.error(stderr.toString());
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

gulp.task('build',            compileTypescript);
gulp.task('buildIgnoreError', compileTypescriptIgnoreError);
gulp.task('watch', watch);
gulp.task('clean', clean);
