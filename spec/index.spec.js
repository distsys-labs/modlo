require('./setup')

const path = require('path')
const fount = require('fount')
const modlo = require('../src/index')

describe('Loader', function () {
  describe('With external fount instance and valid modules', function () {
    let result
    before(function () {
      const loader = modlo({
        fount: fount
      })
      return loader.load({
        patterns: ['./spec/plugins/**/*.js', './spec/things/*.js']
      }).then(x => { result = x })
    })

    it('should result in list of loaded items', function () {
      result.loaded.should.eql([
        'pluginOne.config',
        'pluginTwo.config',
        'helloWorld',
        'pluginOne',
        'three',
        'two',
        'pluginTwo',
        'thingOne'
      ])
    })

    it('should resolve requests for plugin with expected promise', function () {
      return fount.resolve('pluginOne')
        .should.eventually.eql({
          _path: path.resolve('./spec/plugins/one.js'),
          title: 'plugin one',
          list: ['two', 'three'],
          value: {
            _path: path.resolve('./spec/things/one.js'),
            name: 'thingOne',
            description: 'too cool for school'
          }
        })
    })

    after(function () {
      fount.purgeAll()
    })
  })

  describe('With fount container and valid modules', function () {
    let result
    before(function () {
      const loader = modlo({
        fount: fount('test')
      })
      return loader.load({
        patterns: ['./spec/plugins/**/*.js', './spec/things/*.js']
      }).then(x => { result = x })
    })

    it('should result in list of loaded items', function () {
      result.loaded.should.eql([
        'pluginOne.config',
        'pluginTwo.config',
        'helloWorld',
        'pluginOne',
        'three',
        'two',
        'pluginTwo',
        'thingOne'
      ])
    })

    it('should resolve requests for plugin with expected promise', function () {
      return fount.resolve('test_pluginOne')
        .should.eventually.eql({
          _path: path.resolve('./spec/plugins/one.js'),
          title: 'plugin one',
          list: ['two', 'three'],
          value: {
            _path: path.resolve('./spec/things/one.js'),
            name: 'thingOne',
            description: 'too cool for school'
          }
        })
    })

    after(function () {
      fount.purgeAll()
    })
  })

  describe('With internal fount instance', function () {
    let result
    before(function () {
      const loader = modlo({
        modules: []
      })
      return loader.load({
        patterns: ['./spec/plugins/**/*.js', './spec/things/*.js']
      }).then(x => { result = x })
    })

    it('should result in list of loaded items', function () {
      result.loaded.should.eql([
        'pluginOne.config',
        'pluginTwo.config',
        'helloWorld',
        'pluginOne',
        'three',
        'two',
        'pluginTwo',
        'thingOne'
      ])
    })

    it('should resolve requests for plugin with expected promise', function () {
      return result.fount.resolve('pluginOne')
        .should.eventually.eql({
          _path: path.resolve('./spec/plugins/one.js'),
          title: 'plugin one',
          list: ['two', 'three'],
          value: {
            _path: path.resolve('./spec/things/one.js'),
            name: 'thingOne',
            description: 'too cool for school'
          }
        })
    })

    after(function () {
      result.fount.purgeAll()
    })
  })

  describe('With custom namespace', function () {
    let result
    before(function () {
      const loader = modlo({
        fount: fount
      })
      return loader.load({
        patterns: ['./spec/plugins/**/*.js', './spec/things/*.js'],
        namespace: 'myTest'
      }).then(x => { result = x })
    })

    it('should result in list of loaded items', function () {
      result.loaded.should.eql([
        'myTest.pluginOne.config',
        'myTest.pluginTwo.config',
        'myTest.helloWorld',
        'myTest.pluginOne',
        'myTest.three',
        'myTest.two',
        'myTest.pluginTwo',
        'myTest.thingOne'
      ])
    })

    it('should', () => {
      result.fount.containers().sort()
        .should.eql(['myTest', 'myTest.pluginOne', 'myTest.pluginTwo'])
    })

    it('should resolve requests for plugin with expected promise', function () {
      return result.fount.resolve('myTest.pluginOne')
        .should.eventually.eql({
          _path: path.resolve('./spec/plugins/one.js'),
          title: 'plugin one',
          list: ['two', 'three'],
          value: {
            _path: path.resolve('./spec/things/one.js'),
            name: 'thingOne',
            description: 'too cool for school'
          }
        })
    })

    after(function () {
      fount.purgeAll()
    })
  })

  // here to ensure code functions as intended if no modules are registered as
  // factories
  describe('when all module dependencies resolve', function () {
    let result
    before(function () {
      const loader = modlo()
      return loader.load({
        fount: fount,
        patterns: ['./spec/simple/*.js']
      }).then(x => { result = x })
    })

    it('should result in list of loaded items', function () {
      result.loaded.should.eql(['simple'])
    })

    after(function () {
      fount.purgeAll()
    })
  })
})
