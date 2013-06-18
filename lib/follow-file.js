"use strict";

var fs = require('fs')
var path = require('path')
var split = require('split')
var through = require('through')
var log = require('debug')('follow-file')

function readFileTo(readOperation, cb){
  log('read','readContext', 'offset', readOperation.offset, 'read', readOperation.read)
  return fs.createReadStream(readOperation.file, {start: readOperation.offset, end: readOperation.read})
    .pipe(split())
    .on('data',function (line) {
      readOperation.stream.write(line)
    })
    .on('end', cb)
    .on('error', cb)
}


module.exports = function ff(file) {

  function FollowStream(file) {
    this.file = file
    this._stream = through(function write(data) {
        this.emit('data', data)
      })

    this.readContext = {offset: 0, read: 0,
      switchOffsets: function (size) {
        if (this.read > size) {
          log('reset', 'read', 0)
          self.readContext.read = 0
        }
        this.offset = this.read
        self.readContext.read = size
      }
    }

    var self = this

    this._watchfile = function watchFile(){
      log('switch file','readContext', self.readContext)
      var filePath = path.dirname(file)
      fs.watch(filePath, function (event, filename) {

        log('event', event, 'filename', filename, 'file', path.basename(file))

        if (filename ===  path.basename(file)) {

          fs.stat(file, function (err, stat) {
            if (err) {
              if(err.code === 'ENOENT') return // in this case the file is probably being rotated
              throw err
            }

            log('switch offsets')
            self.readContext.switchOffsets(stat.size)

            readFileTo({stream: self._stream, file: file, offset: self.readContext.offset, read: self.readContext.read},function (err) {
              log('read complete', err)
            })
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
      readFileTo({stream: self._stream, file: file, offset: self.readContext.offset, read: self.readContext.read},function (err) {
        log('read complete', err)
      }).on('end', self._watchfile)
    })
  }

  return new FollowStream(file)
}