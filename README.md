## modlo
A dynamic module loader that uses fount for dynamic load and initialization of modules

[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

> Precautions and disclaimers: modlo is experimental, use only as directed, call your doctor or pharmacist if you experience any of the following: 
> * heightened delusions of grandeur
> * spontaneous dental hydroplosion
> * tingling in your extremeties
> * lack of tingling in your extremeties
> * rapid increase in knuckle hair growth

## Purpose
Loads npm modules and modules dynamically based on glob patterns and registers them with fount. Instantiates modules that return a function and satisfies argument list from a fount container. Functions returned can result in a promise or value.

### Naming
Make sure to consider how modlo names. It's going to load a bunch of modules for you and, while that's nice, if you don't understand how it goes about naming them in fount, you're going to have a bad time. Here's how modlo attempts to determine the name of each module's instance (or factory):

 * does the module return an instance?
   * use the `name` property if it is not null or empty
   * otherwise delimit the file name by `.` and use the first part
 * does the module return a function?
   * use the `name` property on the result of the function if it is not null or empty
   * otherwise check to see if the function is named and use that
   * lastly, fall back on using the same file name approach

__Recommended__
```js
module.exports = function superAwesomeThing () {
	// because the function is named, it will be registered in fount
	// as `superAwesomeThing`.
}
```

### Namespaces
Have several modules that take different configurations but all use the same argument name? Fount already has the concept of named containers. You can register these kinds of values namespaced to the module that will need them:

```js
// what if you have several modules that will all get loaded that use the
// same argument name but expect different values specific to them?

// myModule.js
module.exports = function myModule (config) {
	
}

// myOtherModule.js
module.exports = function myOtherModule (config) {
	
}

// when modlo is looking at each module's arguments
// it will check to see if a `config` was registered
// under the namespace of the module first before checking
// the default container for that argument name.
// this way you can have `myModule.config` and `myOtherModule.config`
// registered and resolved correctly.

// you can register to those namespaces explicitly:
fount('myModule').register('config', {})

// or you can return a `_` delimited name from a module and
// fount will treat the first part as the namespace and the second
// part as the key:

// myModule_config.js
module.exports = function myModule_config() {
	return {}
}
```

### Factories vs. Instances
When fount cannot supply all arguments for a module function, the function will be registered as a factory rather than storing the result of the module function call.

## But Why?
I have a few libs that exhibit this kind of behavior in order to make it easy to extend with plugins or by sharing code between things. It seemed like a good opportunity to pull the code into a single lib and improve the feature set, testing and documentation.

I also hate boilerplate code. Any time I think there's a chance to reduce the tons of wire-up code required so a project can just focus on the interesting stuff, I chase that opportunity. YMMV :)

## API

### `( [defaults] )`
Requiring modlo returns an initializer that allows you to provide defaults that will be used when calling load later. The primary use for this is providing an external fount instance so it only needs to be done once:

```js
// no defaults - modlo will use an internal fount instance
const loader = modlo()

// providing your fount instance
const fount = require('fount')
const loader = modlo({ fount: fount })
```

### `load(config)`
Load takes a config hash and returns a promise that will resolve to a list of registered keys and the fount instance they were registered in.

__config hash format__
```js
{
	namespace: '', // a namespace prefix to prefix all loaded modules with
	patterns: []|'', // one or more file globs to load
	modules: []|''. // one or more npm modules to load
	fount: undefined|instance // optional way to provide what fount instance gets used
}
```

__result hash format__
```js
	loaded: [], // the list of keys registered with fount
	fount: instance // the fount instance used for registration
```

#### example - no defaults during init
```js
// no defaults - modlo will use an internal fount instance
const loader = modlo()

// load all `.plugin.js` files from the plugin folder
loader.load({
	patterns: './plugin/*.plugin.js'
}).then(result => {
	// this is why its unlikely you'd want to use
	// modlo's fount instance, you have to capture and
	// pass it on then keep passing it around
	doSomethingWithFount(result.fount)
})
```

#### example - providing your fount instance during init
```js
const fount = require('fount')
const loader = modlo({ fount: fount })

// load all `.plugin.js` files from the plugin folder
// load all `resource.js` files from a folder structure under `./resources`
loader.load({
	patterns: [ './plugin/*.plugin.js', './resources/**/resource.js' ]
}).then(result => {
	// now it's less critical that you capture anything at this stage,
	// it's really more just about waiting for the promise to resolve
	// before completing your service's initialization
})
```

#### example - providing a fount instance at load time
``` js
const fount = require('fount')
const loader = modlo()

// you can wait to provide your fount instance when calling load
// load all `.plugin.js` files from the plugin folder
// load all `resource.js` files from a folder structure under `./resources`
// load and register `when` and `postal` from the npm modules folder
loader.load({
	fount: fount,
	patterns: [ './plugin/*.plugin.js', './resources/**/resource.js' ],
	modules: [ "when", "postal" ]
}).then(result => {
})
```

[travis-url]: https://travis-ci.org/deftly/modlo
[travis-image]: https://travis-ci.org/deftly/modlo.svg?branch=master
[coveralls-url]: https://coveralls.io/github/deftly/modlo?branch=master
[coveralls-image]: https://coveralls.io/repos/github/deftly/modlo/badge.svg?branch=master
