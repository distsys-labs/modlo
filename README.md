## modlo
A dynamic module loader that uses fount for dynamic load and initialization of modules

> Precautions and disclaimers: modlo is experimental, use only as directed, call your doctor or pharmacist if you experience any of the following: 
> * heightened delusions of grandeur
> * spontaneous dental hydroplosion
> * tingling in your extremeties
> * lack of tingling in your extremeties
> * rapid increase in knuckle hair growth

## Purpose
Loads NPM modules and modules from a project dynamically based on glob patterns and registers them with fount. Instantiates modules that return a function and satisfies argument list from a fount container. Functions returned can result in a promise or value. Callback style functions have limited support.

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
module.exports = function superAwesomeThing() {
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
module.exports = function myModule( config ) {
	
};

// myOtherModule.js
module.exports = function myOtherModule( config ) {
	
};

// when modlo is looking at each module's arguments
// it will check to see if a `config` was registered
// under the namespace of the module first before checking
// the default container for that argument name.
// this way you can have `myModule.config` and `myOtherModule.config`
// registered and resolved correctly.

// you can register to those namespaces explicitly:
fount( "myModule" ).register( "config", { ... } );

// or you can return a `_` delimited name from a module and
// fount will treat the first part as the namespace and the second
// part as the key:

// myModule_config.js
module.exports = function myModule_config() {
	return { ... };
}
```

### Factories vs. Instances
When fount cannot supply all arguments for a module function, the function will be registered as a factory rather than storing the result of the module function call.

## But Why?
I have a few libs that exhibit this kind of behavior in order to make it easy to extend with plugins or by sharing code between things. It seemed like a good opportunity to pull the code into a single lib and improve the feature set, testing and documentation.

I also hate boilerplate code. Any time I think there's a chance to reduce the tons of wire-up code required so a project can just focus on the interesting stuff, I chase that opportunity. YMMV :)

## Use

### Initializing
__Simple__
```javascript

// will load all modules from the plugins directory
// that end in 'plugin.js'
var modlo = require( "modlo" );
var loader = modlo( {
	patterns: "./plugins/*.plugin.js"	
} );

loader.load()
	.then( function( loaded ) {
		// returns the list of keys registered in fount as a result
	} );

// use the fount property of the loader to resolve
loader.fount.resolve( "somePlugin" )
	.then( function( plugin ) {
		
	} );

__Custom Fount__
```javascript
var modlo = require( "modlo" );
var fount = require( "fount" );

var loader = modlo( {
	patterns: "./plugins/*.plugin.js",
	fount: fount
} );

loader.load()
	.then( function( loaded ) {
		// returns the list of keys registered in fount as a result
	} );

// use your fount instance directly
fount.resolve( "somePlugin" )
	.then( function( plugin ) {
		
	} );
```

__Multiple Patterns & NPM Modules__
```javascript
var modlo = require( "modlo" );
var fount = require( "fount" );

var loader = modlo( {
	patterns: [ "./plugins/*.plugin.js", "./resources/**/*.js" ],
	modules: [ "npmLib1", "npmLib2" ],
	fount: fount
} );

loader.load()
	.then( function( loaded ) {
		// returns the list of keys registered in fount as a result
	} );

// use your fount instance directly
fount.resolve( "somePlugin" )
	.then( function( plugin ) {
		
	} );
```