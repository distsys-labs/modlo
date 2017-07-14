function getContainer (state, configuration) {
  return configuration.fount || state.fount
}

function invokeFount (call, args) {
  const state = args.shift()
  const configuration = args.shift()
  const container = getContainer(state, configuration)
  return container[ call ].apply(container, args)
}

function inject (...parameters) {
  return invokeFount('inject', parameters)
}

function resolve (...parameters) {
  return invokeFount('resolve', parameters)
}

module.exports = {
  getContainer: getContainer,
  inject: inject,
  resolve: resolve
}
