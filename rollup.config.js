const generateRollupConfig = require('videojs-generate-rollup-config')
const { eslint } = require('rollup-plugin-eslint')
const serve = require('rollup-plugin-serve')
const livereload = require('rollup-plugin-livereload')
const css = require('rollup-plugin-css-only')

const config = generateRollupConfig({
  input: 'src/videojs.thumbnails.js',
  checkWatch: true,
  plugins(defaultPlugins) {
    const writeKeys = ['browser', 'module', 'test']

    const newPlugins = {}
    writeKeys.forEach((key) => {
      newPlugins[key] = defaultPlugins[key]
      newPlugins[key] = ['eslint', 'css'].concat(newPlugins[key])
      newPlugins[key] = newPlugins[key].concat(['serve', 'livereload'])
    })

    return newPlugins
  },
  primedPlugins(defaults) {
    return Object.assign(defaults, {
      eslint: eslint({
        useEslintrc: true,
        throwOnError: true,
        exclude: ['dist/**', 'node_modules/**', 'src/**/*.css'],
      }),
      serve: serve({
        open: true,
        openPage: '/demo/example.html',
        contentBase: './',
        host: 'localhost',
        port: '10000',
      }),
      livereload: livereload({
        watch: 'dist',
        verbose: true,
      }),
      css: css({
        output: 'dist/videojs-thumbnails.css',
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
