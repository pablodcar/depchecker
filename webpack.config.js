'use strict';

var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  target: 'node',
  node: {
    __dirname: false,
    __filename: true
  },
  entry: './dep-checker-webtask.js',
  output: {
    path: './dist',
    filename: 'depchecker.js'
  },
  externals: nodeModules
};