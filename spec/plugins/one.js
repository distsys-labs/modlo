module.exports = function pluginOne (when, thingOne, two, three, config) {
  return when({
    title: config.title,
    value: thingOne,
    list: [ two.name, three.name ]
  })
}
