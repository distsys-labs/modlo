import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { fount } from 'fount'
import { getContainer, inject } from '../src/utility.js'

// Suppress console.error for cleaner test output
global.console.error = () => {}

describe('Utility Module', () => {
  describe('Fount', () => {
    describe('when getting container from state', () => {
      let state: any, config: any

      beforeEach(() => {
        state = { fount: fount }
        config = {}
        fount.register('a', 1)
        fount.registerFactory('b', function () { return 2 })
        fount.register('c', 3)
      })

      it("should get state's fount instance", () => {
        assert.strictEqual(getContainer(state, config), fount)
      })

      it('should inject values from container', async () => {
        const result = await inject(state, config, ['a', 'b', 'c'], function (a: number, b: number, c: number) { return a + b + c })
        assert.strictEqual(result, 6)
      })

      afterEach(() => {
        fount.purgeAll()
      })
    })

    describe('when configuration provides a fount instance', () => {
      let state: any, config: any

      beforeEach(() => {
        state = { fount: {} }
        config = { fount: fount }
        fount.register('a', 1)
        fount.registerFactory('b', function () { return 2 })
        fount.register('c', 3)
      })

      it("should get config's fount instance", () => {
        assert.strictEqual(getContainer(state, config), fount)
      })

      it('should inject values from container', async () => {
        const result = await inject(state, config, ['a', 'b', 'c'], function (a: number, b: number, c: number) { return a + b + c })
        assert.strictEqual(result, 6)
      })

      afterEach(() => {
        fount.purgeAll()
      })
    })
  })
})
