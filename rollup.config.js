const generateRollupConfig = require('videojs-generate-rollup-config')
const { eslint } = require('rollup-plugin-eslint')
const serve = require('rollup-plugin-serve')
const livereload = require('rollup-plugin-livereload')
const css = require('rollup-plugin-css-only')

const environment = process.env.BUILD

const config = generateRollupConfig({
  input: 'src/videojs.thumbnails.js',
  checkWatch: true,
  plugins(defaultPlugins) {
    const writeKeys = ['browser', 'module', 'test']

    const newPlugins = {}
    writeKeys.forEach((key) => {
      newPlugins[key] = defaultPlugins[key]
      newPlugins[key] = ['eslint', 'css'].concat(newPlugins[key])
      if (environment === 'development') {
        newPlugins[key] = newPlugins[key].concat(['serve', 'livereload'])
      }
    })

    return newPlugins
  },
  primedPlugins(defaults) {
    let developmentStage = {}

    if (environment === 'development') {
      developmentStage = {
        serve: serve({
          open: true,
          openPage: '/demo/index.html',
          contentBase: './',
          host: 'localhost',
          port: '10000',
        }),
        livereload: livereload({
          watch: 'dist',
          verbose: true,
        }),
      }
    }

    return Object.assign(
      defaults,
      {
        eslint: eslint({
          useEslintrc: true,
          throwOnError: true,
          exclude: ['dist/**', 'node_modules/**', 'src/**/*.css'],
        }),
        css: css({
          output: 'dist/videojs-thumbnails.css',
        }),
      },
      developmentStage,
    )
  },
  babel(babelConfig) {
    const newBabelConfig = Object.assign({}, babelConfig)

    newBabelConfig.babelrc = true
    delete newBabelConfig.presets
    delete newBabelConfig.plugins
    delete newBabelConfig.exclude

    return newBabelConfig
  },
})

export default Object.values(config.builds)
