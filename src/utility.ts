import type { ModloConfig } from './types.js'

interface State {
  fount: any
}

function getContainer(state: State, configuration: ModloConfig): any {
  return configuration.fount || state.fount
}

function invokeFount(call: string, args: any[]): any {
  const state = args.shift()
  const configuration = args.shift()
  const container = getContainer(state, configuration)
  return container[call].apply(container, args)
}

export function inject(...parameters: any[]): any {
  return invokeFount('inject', parameters)
}

export function resolve(...parameters: any[]): any {
  const state = parameters[0]
  const configuration = parameters[1]
  const keys = parameters[2]

  const container = getContainer(state, configuration)

  // If an array is passed, use resolveAll, otherwise use resolve
  if (Array.isArray(keys)) {
    return container.resolveAll(keys)
  } else {
    return container.resolve(keys)
  }
}

export { getContainer }
