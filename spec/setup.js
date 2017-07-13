var chai = require('chai')
chai.use(require('chai-as-promised'))
global.should = chai.should()
global.expect = chai.expect
global.lift = require('when/node').lift
global.seq = require('when/sequence')
global.fs = require('fs')
global.path = require('path')

console.error = () => {}
