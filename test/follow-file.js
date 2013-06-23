"use strict";
var path = require('path')
var fs = require('fs')
var expect = require('chai').expect
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var log = require('debug')('test')

var ff = require('../index.js')

describe('Follow', function () {


  function writeRemaining(stream, count, cb){
    log('appending')
    for (var i = 0; i < count; i++){
      stream.write('Jun 16 10:20:58 server.hostname coreaudiod[121]: Enabled automatic stack shots because audio IO is inactive ' + i + ' \n', 'utf-8')
    }
    stream.on('end', cb)
  }

  it('should read through the file when it starts', function (done) {

    var lines = 0

    ff(path.join(__dirname, 'syslog.log'), {start: 100}).on('data', function (line) {
      log('line', line)
      lines++
      if (lines === 8) {
        done()
      }
    })

  })

  it('should follow updates to the file', function (done) {

    rimraf(path.join(__dirname, 'tmp'), function () {

      mkdirp(path.join(__dirname, 'tmp'), function () {

        log('started')
        fs.createReadStream(path.join(__dirname, 'syslog.log'), {start: 0, end: 860}).pipe(fs.createWriteStream(path.join(__dirname, 'tmp', 'syslog.log'))).on('close', function(){
          log('finished initial read')
          var lines = 0
          var totalLines = 80

          ff(path.join(__dirname, 'tmp', 'syslog.log'), {start: 100}).on('data', function (line) {
            log('lines++', lines++)
            if (lines === totalLines) {
              done()
            }
          })

          var stream = fs.createWriteStream(path.join(__dirname, 'tmp', 'syslog.log'), {flags: 'a'})

          writeRemaining(stream, 72, function(){
            log('finished extra write')
          })

        })
      })
    })
  })

  it('should follow a file even if it is deleted', function(done){

    var lines = 0
    var totalLines = 100
    var deleted = false
    ff(path.join(__dirname, 'tmp', 'syslog.log'), {start: 100}).on('data', function (line) {
      log('lines++', lines++)
      if (lines === totalLines) {
        log('all done')
        done()
      }

    })

    setInterval(function(){
      log('lines are', lines)
      if (lines === 80 && !deleted){
        deleted = true
        log('delete file')
        fs.unlink(path.join(__dirname, 'tmp', 'syslog.log'), function(){
          log('create file.')
          var stream = fs.createWriteStream(path.join(__dirname, 'tmp', 'syslog.log'), {flags: 'w'})
          writeRemaining(stream, 20, function(){
            log('finished')
          })
        })
      }

    }, 10)
  })

})