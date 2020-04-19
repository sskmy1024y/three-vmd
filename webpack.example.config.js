/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'example', 'module', 'index.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.glsl$/,
        use: 'raw-loader',
      },
      {
        test: /\.(vrm|vmd)$/,
        use: [
          {
            loader: 'file-loader?name=[path][name].[ext]',
            options: {
              name: '[path][name].[ext]',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: ['node_modules'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'example', 'module', 'index.html'),
      filename: 'index.html',
    }),
  ],
  devServer: {
    contentBase: [path.resolve(__dirname, 'dist')],
  },
}
