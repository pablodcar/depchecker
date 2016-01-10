'use strict';

var gulp = require('gulp');
var insert = require('gulp-insert');
var webpack = require('webpack');
var path = require('path');

gulp.task('bundle', function() {

  var webpackConfig = require('./webpack.config.js');
  webpack(webpackConfig, function(err, stats) {
    if (!!err) {
      console.log('Error packing webtask with webpack: ');
      console.log(err);
      return;
    }

    var time = stats.endTime - stats.startTime;
    console.log('Webtask built with webpack in ' + time + ' seconds');

    gulp.src(path.join(webpackConfig.output.path, webpackConfig.output.filename))
      .pipe(insert.prepend('module.exports = \n'))
      .pipe(gulp.dest('dist'));

  });

});