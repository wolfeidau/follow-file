"use strict";

var tail = require('./tail')
var split = require('split')
var through = require('through')
var log = require('debug')('follow-file')

module.exports = function ff(file) {
  log('file', file)
  return tail(file).pipe(split())
}