// https://github.com/shelljs/shelljs
const shell = require('shelljs')
shell.env.NODE_ENV = 'production'

var path = require('path')
var ora = require('ora')
var webpack = require('webpack')
var webpackConfig = require('./webpack.prod.conf')

console.log(
  '  Tip:\n' +
  '  Built files are meant to be served over an HTTP server.\n' +
  '  Opening index.html over file:// won\'t work.\n'
)

var spinner = ora('building for production...')
spinner.start()

var distPath = path.resolve(__dirname, '../dist')
var assetsPath = path.resolve(distPath, 'assets')
shell.rm('-rf', distPath)
shell.mkdir('-p', distPath)
// shell.rm('-rf', assetsPath)
shell.mkdir('-p', assetsPath)
shell.cp('-R', 'assets/static/*', assetsPath)
// shell.cp('-R', 'src/_locales/*', distPath)
shell.cp('-R', 'src/_locales', distPath)
shell.cp('src/manifest.json', distPath)

webpack(webpackConfig, function (err, stats) {
  spinner.stop()
  if (err) throw err
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }) + '\n')
})
