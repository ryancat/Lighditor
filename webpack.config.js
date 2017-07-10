var path = require('path')
var webpack = require('webpack')
var FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin')

var definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true'))
})

module.exports = {
  entry: {
    app: [
      // 'babel-polyfill',
      path.resolve(__dirname, 'src/index.js')
    ]
  },
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'dist'),
    filename: 'lighditor.js'
  },
  devtool: 'cheap-source-map',
  watch: true,
  plugins: [
    definePlugin,
    new FlowBabelWebpackPlugin()
  ],
  module: {
    rules: [
      // Javascript
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: path.join(__dirname, 'src')
      },
      // Sass
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        include: path.join(__dirname, 'src')
      }
    ]
  },
  resolve: {
    modules: [
      path.join(__dirname),
      path.join(__dirname, 'src'),
      'node_modules'
    ],
    extensions: ['.js', '.scss']
  }
}
