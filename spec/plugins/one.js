module.exports = function pluginOne (thingOne, two, three, config) {
  return Promise.resolve({
    title: config.title,
    value: thingOne,
    list: [two.name, three.name]
  })
}
