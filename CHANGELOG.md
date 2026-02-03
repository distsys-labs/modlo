# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/arobson/modlo/compare/v1.2.2...v2.0.0) (2026-02-01)

### ⚠ BREAKING CHANGES

* **Pure ESM package** - modlo is now a pure ESM package. CommonJS `require()` is no longer supported. Use `import` instead.
* **Node.js >=18 required** - Minimum Node.js version is now 18.0.0
* **TypeScript rewrite** - Source code is now in TypeScript, compiled to JavaScript in `dist/`
* **API remains compatible** - The public API (`modlo(defaults)` and `loader.load(config)`) remains the same

### Features

* **TypeScript** - Full TypeScript support with type declarations included
* **ESM modules** - Native ES module support, loads both ESM and CommonJS modules
* **Modern dependencies** - Updated to latest fount (1.2.0+) with built-in TypeScript support
* **fast-glob** - Replaced globulesce with fast-glob for better performance
* **Node.js test runner** - Uses built-in Node.js test runner (node:test) instead of external frameworks

### Changes

* **Removed dependencies**: globulesce, fauxdash (no longer needed)
* **Build step required**: Source must be compiled with `npm run build` before publishing
* **Package structure**: Main entry is `dist/index.js` with type declarations in `dist/index.d.ts`

### Migration Guide

For users upgrading from v1.x:

1. **Update Node.js**: Ensure you're using Node.js >=18
2. **Update imports**: Change from `const modlo = require('modlo')` to `import modlo from 'modlo'`
3. **Update fount imports**: Change from `const fount = require('fount')` to `import { fount } from 'fount'`
4. **Module files**: Consider migrating your plugin files to TypeScript/ESM for better type safety

The API remains the same - all `modlo()` initialization and `loader.load()` calls work identically to v1.x.

### [1.2.2](https://github.com/arobson/modlo/compare/v1.2.1...v1.2.2) (2021-01-30)


### Bug Fixes

* cleanup dependencies and eliminate audit flags ([a71385c](https://github.com/arobson/modlo/commit/a71385c7878dbeaac2c21277864faeb557ed6fdd))

<a name="1.2.1"></a>
# [1.2.1](https://github.com/arobson/modlo/compare/v1.1.4...v1.2.1) (2017-07-16)


### Bug Fixes

* bump version of fauxdash to fix argument parsing for default values ([50c5935](https://github.com/arobson/modlo/commit/50c5935))


### Features

* drop when and lodash dependencies, introduce fauxdash, bump fount and globulesce depdendencies, improve build and test process ([87cf076](https://github.com/arobson/modlo/commit/87cf076))



## 1.2.0

 * Fount and globulesce to 1.x
 * drop when and lodash
 * move common utility to fauxdash
 * introduce travis and coveralls for build
 * use standard commits
 * adopt standard code style

## 1.1.x

### 1.1.4
 * Bump fount dependency
 * Remove when as a dependency

### 1.1.3
 * Upgrade fount dependnecy to 1.0.0
 * Allow custom namespace prefix when loading

### 1.1.1
Change to allow fount container to be passed in place of full fount instance.

### 1.1.0
Breaking change to module initialization and configuration.

## 1.0.0 Initial release