export interface ModloConfig {
  fount?: any
  patterns?: string | string[]
  modules?: string | string[]
  namespace?: string
}

export interface ModuleInfo {
  name: string
  value: any
  isFunction: boolean
  dependencies: string[]
  path: string
}

export interface ModulePathInfo {
  path: string
  name: string | undefined
}

export interface LoadResult {
  loaded: string[]
  fount: any
}

export interface ModloLoader {
  load: (config: ModloConfig) => Promise<LoadResult>
}
