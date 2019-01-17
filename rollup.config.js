const generateRollupConfig = require('videojs-generate-rollup-config')
const { eslint } = require('rollup-plugin-eslint')

const config = generateRollupConfig({
  input: 'src/videojs.thumbnails.js',
  checkWatch: true,
  plugins(defaultPlugins) {
    return {
      browser: ['eslint'].concat(defaultPlugins.browser),
      module: ['eslint'].concat(defaultPlugins.module),
      test: ['eslint'].concat(defaultPlugins.test),
    }
  },
  primedPlugins(defaults) {
    return Object.assign(defaults, {
      eslint: eslint({
        useEslintrc: true,
        throwOnError: true,
        exclude: ['dist/**', 'node_modules/**'],
      }),
    })
  },
  babel(babelConfig) {
    const newBabelConfig = Object.assign({}, babelConfig)

    newBabelConfig.babelrc = true
    delete newBabelConfig.presets
    delete newBabelConfig.plugins
    delete newBabelConfig.exclude

    return newBabelConfig
  }
})

export default Object.values(config.builds)
