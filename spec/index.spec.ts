import { describe, it, after } from 'node:test'
import assert from 'node:assert'
import { fount } from 'fount'
import modlo from '../src/index.js'

// Suppress console.error for cleaner test output
global.console.error = () => {}

describe('Loader', () => {
  after(() => {
    // Clean up after all tests
    fount.purgeAll()
  })

  it('should load simple modules without dependencies', async () => {
    const loader = modlo()
    const result = await loader.load({
      fount: fount,
      patterns: ['./spec/simple/*.ts']
    })

    assert.deepStrictEqual(result.loaded, ['simple'])
    fount.purgeAll()
  })

  it('should load modules without dependencies from plugins folder', async () => {
    const loader = modlo({ fount })
    const result = await loader.load({
      patterns: [
        './spec/plugins/helloWorld.ts',
        './spec/plugins/two/plugin.ts',
        './spec/plugins/three/plugin.ts',
        './spec/things/one.ts'
      ]
    })

    // helloWorld, two, three, thingOne all have no dependencies
    assert.strictEqual(result.loaded.length, 4)
    assert.ok(result.loaded.includes('helloWorld'))
    assert.ok(result.loaded.includes('two'))
    assert.ok(result.loaded.includes('three'))
    assert.ok(result.loaded.includes('thingOne'))

    fount.purgeAll()
  })

  it('should load config modules with underscore naming', async () => {
    const loader = modlo({ fount })
    const result = await loader.load({
      patterns: ['./spec/plugins/config/*.ts']
    })

    // Config modules use underscore naming: pluginOne_config -> pluginOne.config
    assert.deepStrictEqual(result.loaded.sort(), ['pluginOne.config', 'pluginTwo.config'])

    // Verify they're registered in namespaced containers
    const pluginOneConfig = await fount('pluginOne').resolve('config')
    assert.strictEqual(pluginOneConfig.title, 'plugin one')

    const pluginTwoConfig = await fount('pluginTwo').resolve('config')
    assert.strictEqual(pluginTwoConfig.title, 'plugin two')

    fount.purgeAll()
  })

  it('should load interdependent modules with multi-pass registration', async () => {
    const loader = modlo({ fount })
    const result = await loader.load({
      patterns: ['./spec/plugins/**/!(bad).ts', './spec/things/*.ts']
    })

    // All modules should be loaded
    const expected = [
      'pluginOne.config',
      'pluginTwo.config',
      'helloWorld',
      'pluginOne',
      'three',
      'two',
      'pluginTwo',
      'thingOne'
    ]
    assert.deepStrictEqual(result.loaded.sort(), expected.sort())

    // Verify pluginOne resolved its dependencies correctly
    const pluginOne = await fount.resolve('pluginOne')
    assert.strictEqual(pluginOne.title, 'plugin one')
    assert.strictEqual(pluginOne.value.name, 'thingOne')
    assert.deepStrictEqual(pluginOne.list, ['two', 'three'])

    fount.purgeAll()
  }, { timeout: 10000 })
})
