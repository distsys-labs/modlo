import fg from 'fast-glob'
import { createRequire } from 'module'
import path from 'path'
import { getArguments } from './lib/module-parser.js'
import type { LoadResult, ModloConfig, ModloLoader, ModuleInfo, ModulePathInfo } from './types.js'

// Returns a list of files from given glob patterns
async function getModuleList(patterns: string[]): Promise<ModulePathInfo[]> {
  const files = await fg(patterns, {
    ignore: ['.git/**', 'node_modules/**'],
    absolute: false,
    cwd: process.cwd()
  })

  return files.map(modulePath => ({
    path: modulePath,
    name: undefined
  }))
}

// Get single list of all modules to load and add metadata about each
async function getDependencyList(
  fount: any,
  patterns: string[],
  modules: string[]
): Promise<ModuleInfo[]> {
  modules.forEach(name => {
    fount.registerModule(name)
  })

  const moduleList = await getModuleList(patterns)
  const moduleInfos = await Promise.all(moduleList.map(info => getModuleInfo(info)))
  return moduleInfos.filter((m): m is ModuleInfo => m !== null)
}

// Load module and add metadata about it for use in registering with fount
async function getModuleInfo(module: ModulePathInfo): Promise<ModuleInfo | null> {
  try {
    const resolvedPath = path.resolve(module.path)

    // Try ESM import first, fallback to CommonJS
    let moduleResult: any
    try {
      // Dynamic import for ESM modules
      const imported = await import(resolvedPath)
      moduleResult = imported.default ?? imported
    } catch {
      // Fallback to CommonJS using createRequire
      try {
        const require = createRequire(import.meta.url)
        delete require.cache[resolvedPath]
        moduleResult = require(resolvedPath)
      } catch {
        // Module failed to load as both ESM and CommonJS
        return null
      }
    }

    const fileName = path.basename(module.path)
    const fileNameWithoutExt = fileName.replace(path.extname(fileName), '').split('.')[0]
    const functionName = (moduleResult.name && moduleResult.name !== 'default') ? moduleResult.name : undefined
    const moduleName = module.name || functionName || fileNameWithoutExt
    const isFunction = typeof moduleResult === 'function'
    const args = isFunction ? getArguments(moduleResult) : []

    return {
      name: moduleName,
      value: moduleResult,
      isFunction,
      dependencies: args,
      path: module.path
    }
  } catch (err: any) {
    const lines = err.stack?.split('\n').slice(0, 2).join('\n') || err.message
    console.error(`Error loading module at ${module.path}:\n ${lines}`)
    return null
  }
}

// Create name to register the module by
function getRegistrationName(namespace: string | undefined, module: ModuleInfo): string {
  if (namespace) {
    return [namespace].concat(module.name.split('_')).join('.')
  } else {
    return module.name.split('_').join('.')
  }
}

// Create qualified name for argument
function getQualifiedName(namespace: string | undefined, module: ModuleInfo, arg: string): string {
  const registrationName = getRegistrationName(namespace, module)
  return [registrationName, arg].join('.')
}

// Create qualified name for argument
function getNamespaceName(namespace: string | undefined, arg: string): string {
  return [namespace, arg].join('.')
}

async function load(config: ModloConfig): Promise<LoadResult> {
  const fountInstance = config.fount || (await import('fount')).fount
  const patterns = normalizeToArray(config.patterns)
  const modules = normalizeToArray(config.modules)

  const list = await getDependencyList(fountInstance, patterns, modules)
  await registerAll(fountInstance, config.namespace, list, 0)

  const keys = list.map(module => getRegistrationName(config.namespace, module))

  return {
    loaded: keys.concat(modules),
    fount: fountInstance
  }
}

function normalizeToArray(value: string | string[] | undefined): string[] {
  return typeof value === 'string' ? [value] : (value || [])
}

// Attempt to register all modules with fount using multiple passes
// to ensure all dependencies are available before attempting to
// determine whether a module's resulting function should be registered
// as a factory or a static result
async function registerAll(
  fount: any,
  namespace: string | undefined,
  modules: ModuleInfo[],
  failures: number
): Promise<ModuleInfo[]> {
  if (failures < 2 || modules.length === 0) {
    const remaining = await registerModules(fount, namespace, modules)

    if (remaining.length) {
      if (remaining.length === modules.length) {
        failures++
      }
      return registerAll(fount, namespace, remaining, failures)
    }
    return []
  } else {
    modules.forEach(module => {
      const name = getRegistrationName(namespace, module)
      fount.register(name, module.value)
    })
    return []
  }
}

// Attempt to register modules based on whether their dependencies
// can be resolved by fount.
// Resolves to a list of modules that have unresolved dependencies
async function registerModules(
  fount: any,
  namespace: string | undefined,
  modules: ModuleInfo[]
): Promise<ModuleInfo[]> {
  const remaining: ModuleInfo[] = []

  await Promise.all(modules.map(async module => {
    try {
      await tryRegistration(fount, namespace, module)
    } catch {
      remaining.push(module)
    }
  }))

  return remaining
}

// Attempt to register a module by looking at its dependency list
// Rejects if the module has dependencies that can't be resolved by fount yet
async function tryRegistration(
  fount: any,
  namespace: string | undefined,
  moduleInfo: ModuleInfo
): Promise<string> {
  function onResult(result: any): string {
    result._path = moduleInfo.path
    const name = getRegistrationName(namespace, moduleInfo)
    fount.register(name, result)
    return moduleInfo.name
  }

  if (moduleInfo.isFunction) {
    if (moduleInfo.dependencies.length) {
      const dependencies = moduleInfo.dependencies
      const argList: string[] = []

      dependencies.forEach(arg => {
        const qualifiedName = getQualifiedName(namespace, moduleInfo, arg)
        const namespaceName = getNamespaceName(namespace, arg)

        // Check in order of precedence:
        // 1. Qualified name (e.g., "pluginOne.config" for arg "config" in pluginOne)
        // 2. Namespace-scoped (e.g., "myTest.config" if namespace is "myTest")
        // 3. Plain name (e.g., "thingOne")
        if (fount.canResolve(qualifiedName)) {
          argList.push(qualifiedName)
        } else if (namespace && fount.canResolve(namespaceName)) {
          argList.push(namespaceName)
        } else if (fount.canResolve(arg)) {
          argList.push(arg)
        }
      })

      const canResolve = argList.length === dependencies.length
      if (canResolve) {
        const result = await fount.inject(argList, moduleInfo.value)
        return onResult(result)
      } else {
        return Promise.reject(moduleInfo)
      }
    } else {
      const result = moduleInfo.value()
      // If the result is a promise, await it
      if (result && typeof result.then === 'function') {
        return result.then(onResult)
      }
      return onResult(result)
    }
  } else {
    return onResult(moduleInfo.value)
  }
}

function initialize(defaults?: ModloConfig): ModloLoader {
  async function loadWithDefaults(config: ModloConfig): Promise<LoadResult> {
    const effective = Object.assign(defaults || {}, config)
    return load(effective)
  }

  return {
    load: loadWithDefaults
  }
}

export default initialize
