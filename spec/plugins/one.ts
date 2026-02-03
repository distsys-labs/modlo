export default function pluginOne (thingOne: any, two: any, three: any, config: any) {
  return Promise.resolve({
    title: config.title,
    value: thingOne,
    list: [two.name, three.name]
  })
}
