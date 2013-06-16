"use strict";

var fs = require('fs')
var path = require('path')
var split = require('split')
var through = require('through')
var log = require('debug')('follow-file')

module.exports = function ff(file) {

  function FollowStream(file) {
    this.file = file
    this._stream = through(function write(data) {
        log('data', data)
        this.emit('data', data)
      })

    this.readContext = {offset: 0, read: 0, switchOffsets: function(){this.offset = this.read}}

    var self = this

    this._readFile = function readFileTo(){
      log('read','readContext', self.readContext)
      return fs.createReadStream(file, {start: self.readContext.offset, end: self.readContext.read})
        .pipe(split())
        .on('data',function (line) {
          self._stream.write(line)
        })
    }

    this._watchfile = function watchFile(){
      log('switch file','readContext', self.readContext)
      var filePath = path.dirname(file)
      fs.watch(filePath, function (event, filename) {
        log('event', event, 'filename', filename)
        if (filename == file) {
          fs.stat(file, function (err, stat) {
            if (err) throw err
            if (self.readContext.read > stat.size){
              self.readContext.read = 0
              return
            }
            self.readContext.switchOffsets()
            self.readContext.read = stat.size
            self._readFile()
          })
        }
      })
    }

    this.follow = function follow(){
      return this._stream
    }

    // if the file exists
    fs.stat(file, function (err, stat) {
      if (err) throw err
      self.readContext.read = stat.size
      self._readFile().on('end', self._watchfile)
    })
  }

  return new FollowStream(file)
}