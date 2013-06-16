"use strict";
var path = require('path')
var expect = require('chai').expect

var ff = require('../index.js')

describe('Follow', function(){

  it('should read through the file when it starts', function(done){

    var lines = 0

    ff(path.join(__dirname, 'syslog.log')).stream.on('data', function(line){
      lines++
      if(lines === 8){
        done()
      }
    })

  })

})