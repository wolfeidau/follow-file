"use strict";

var spawn = require('child_process').spawn

var nodeTail = require('tailing-stream').createReadStream,
  which = require('which').sync

module.exports = function tail(p) {
  var useNode = false
  try {
    which('tail')
  }
  catch (err) {
    useNode = true
  }

  if (useNode) {
    return nodeTail(p, { timeout: false })
  }
  else {
    var tailc = spawn('tail', [ '-Fn', '100', p])
    tailc.stdout.stderr = tailc.stderr
    return tailc.stdout
  }
}