export default function pluginTwo (config: any) {
  return Promise.resolve({
    title: config.title
  })
}
