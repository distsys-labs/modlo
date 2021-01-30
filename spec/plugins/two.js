module.exports = function pluginTwo (config) {
  return Promise.resolve({
    title: config.title
  })
}
