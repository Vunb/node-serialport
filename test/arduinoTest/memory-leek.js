'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var SerialPort = require('../../lib/serialport');
var heapdump = require('heapdump');

var port = process.env.TEST_PORT;

if (!port) {
  console.error('Please pass TEST_PORT environment variable');
  process.exit(1);
}

if (!global.gc) {
  console.error('please run with node --expose-gc');
  process.exit(1);
}

// setInterval(function() {
//   // console.log('forcing GC');
//   global.gc();
//   console.log(process.memoryUsage());
// }, 1000);

// function dumpHeap() {
//   console.log('Dumping heap');
//   heapdump.writeSnapshot();
// }

// setTimeout(dumpHeap, 6000);
// setInterval(dumpHeap, 30000);

var counter = 0;

function makePromise() {
  var serialPort;
  return new Promise(function(resolve, reject) {
    counter++;
    if (counter % 1000 === 0) {
      console.log('Attempt ' + counter);
      global.gc();
      console.log(process.memoryUsage());
      heapdump.writeSnapshot();
    }
    var options = {
      baudrate: 115200,
      parser: SerialPort.parsers.raw,
      autoOpen: false
    };
    serialPort = new SerialPort(port, options);
    serialPort.on('open', resolve);
    serialPort.on('error', reject);
    serialPort.open();
  }).then(function(err) {
    if (err) {
      return Promise.reject(err);
    }
  }).then(function() {
    return new Promise(function(resolve) {
      serialPort.on('close', resolve);
      serialPort.close();
    });
  }).then(function(err) {
    //console.log('Closed successfully');
    if (err) {
      return Promise.reject(err);
    }
  }).then(function() {
    return makePromise();
  });
}

makePromise().then(function() {
  process.exit(0);
}, function(err) {
  console.error(err);
  process.exit(1);
});
