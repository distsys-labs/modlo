const _ = require('lodash')
const path = require('path')
const utility = require('./utility')
const glob = require('globulesce')
const getArguments = utility.getArguments

// returns a list of files from a given parent directory
function getModuleList (patterns) {
  return glob('./', patterns, [ '.git', 'node_modules' ])
    .then(collections => {
      const list = _.filter(_.flatten(collections))
      return list.map(modulePath => {
        return { path: modulePath, name: undefined }
      })
    })
}

// get single list of all modules to load and add metadata about each
function getDependencyList (fount, patterns, modules) {
  modules.forEach(name => {
    fount.registerModule(name)
  })
  return getModuleList(patterns, modules)
    .then(moduleList => {
      return moduleList.map(info => {
        return getModuleInfo(info)
      })
    })
}

// load module and add metadata about it for use in registering with fount
function getModuleInfo (module) {
  try {
    const key = path.resolve(module.path)
    delete require.cache[ key ]
    const moduleResult = require(module.path)
    const fileName = path.basename(module.path)
    const moduleName = module.name || moduleResult.name || fileName.replace(path.extname(fileName), '')
    const isFunction = _.isFunction(moduleResult)
    const args = isFunction ? getArguments(moduleResult) : []
    return {
      name: moduleName,
      value: moduleResult,
      isFunction: isFunction,
      dependencies: args,
      path: module.path
    }
  } catch (err) {
    const lines = err.stack.split('\n').slice(0, 2).join('\n')
    console.error(`Error loading module at ${module.path}:\n ${lines}`)
    return null
  }
}

// create name to register the module by
function getRegistrationName (namespace, module) {
  if (namespace) {
    return [ namespace ].concat(module.name.split('_')).join('.')
  } else {
    return module.name.split('_').join('.')
  }
}

// create qualified name for argument
function getQualifiedName (namespace, module, arg) {
  const registrationName = getRegistrationName(namespace, module)
  return [ registrationName, arg ].join('.')
}

// create qualified name for argument
function getNamespaceName (namespace, arg) {
  return [ namespace, arg ].join('.')
}

function load (config) {
  const fount = config.fount || require('fount')
  const patterns = normalizeToArray(config.patterns)
  const modules = normalizeToArray(config.modules)
  return getDependencyList(fount, patterns, modules)
    .then(list => {
      const filtered = _.filter(list)
      return registerAll(fount, config.namespace, filtered, 0)
        .then(() => {
          const keys = filtered.map(module => {
            return getRegistrationName(config.namespace, module)
          })
          return {
            loaded: keys.concat(modules),
            fount: fount
          }
        })
    })
}

function normalizeToArray (value) {
  return _.isString(value) ? [ value ] : (value || [])
}

// attempt to register all modules with fount using multiple passes
// to ensure all dependencies are available before attempting to
// determine whether a module's resulting function should be registered
// as a factory or a static result
function registerAll (fount, namespace, modules, failures) {
  if (failures < 2 || modules.length === 0) {
    return registerModules(fount, namespace, modules)
      .then(remaining => {
        if (remaining.length) {
          if (remaining.length === modules.length) {
            failures++
          }
          return registerAll(fount, namespace, remaining, failures)
        }
        return Promise.resolve([])
      })
  } else {
    modules.forEach(module => {
      var name = getRegistrationName(namespace, module)
      fount.register(name, module.value)
    })
    return Promise.resolve([])
  }
}

// attempt to register modules based on whether their dependencies
// can be resolved by fount.
// resolves to a list of modules that have unresolved dependencies
function registerModules (fount, namespace, modules) {
  var remaining = []
  return Promise.all(modules.map(module => {
    return tryRegistration(fount, namespace, module)
      .then(null, () => remaining.push(module))
  }))
  .then(() => remaining)
}

// attempt to register a module by looking at its dependnecy list
// rejects if the module has dependencies that can't be resolved by fount yet
function tryRegistration (fount, namespace, moduleInfo) {
  function onResult (result) {
    result._path = moduleInfo.path
    const name = getRegistrationName(namespace, moduleInfo)
    // console.log( "registering", name, result );
    fount.register(name, result)
    return moduleInfo.name
  }

  if (moduleInfo.isFunction) {
    if (moduleInfo.dependencies.length) {
      const dependencies = moduleInfo.dependencies
      const argList = []
      dependencies.forEach(arg => {
        const qualifiedName = getQualifiedName(namespace, moduleInfo, arg)
        const namespaceName = getNamespaceName(namespace, arg)
        if (_.isFunction(fount) && fount(moduleInfo.name).canResolve(arg)) {
          argList.push(qualifiedName)
        } else if (fount.canResolve(qualifiedName)) {
          argList.push(qualifiedName)
        } else if (fount.canResolve(namespaceName)) {
          argList.push(namespaceName)
        } else if (fount.canResolve(arg)) {
          argList.push(arg)
        }
      })
      const canResolve = argList.length === dependencies.length
      if (canResolve) {
        return fount.inject(argList, moduleInfo.value)
          .then(onResult)
      } else {
        return Promise.reject(moduleInfo)
      }
    } else {
      return Promise.resolve(onResult(moduleInfo.value()))
    }
  } else {
    return Promise.resolve(onResult(moduleInfo.value))
  }
}

function initialize (defaults) {
  function loadWithDefaults (config) {
    const effective = Object.assign(defaults || {}, config)
    return load(effective)
  };
  return {
    load: loadWithDefaults
  }
};

module.exports = initialize
