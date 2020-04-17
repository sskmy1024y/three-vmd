import * as path from 'path'
import * as webpack from 'webpack'
import * as merge from 'webpack-merge'

const base = (mode: 'production' | 'development'): webpack.Configuration => {
  const isProd = mode === 'production'

  return {
    mode,
    entry: path.resolve(__dirname, 'src', 'index.ts'),
    output: {
      path: path.resolve(__dirname, 'lib'),
      filename: `three-vmd.module.js`,
      library: 'vmd',
      libraryTarget: 'umd',
      globalObject: 'this',
    },
    externals: {
      three: 'three',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        },
        {
          test: /\.(frag|vert)$/,
          use: 'raw-loader',
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts'],
      modules: ['node_modules'],
    },
    plugins: [new webpack.DefinePlugin({ 'process.env': { NODE_ENV: mode } })],
    devtool: isProd ? false : 'inline-source-map',
  }
}

export default (env: any, argv: any): webpack.Configuration[] => {
  const isProd = argv.mode === 'production'

  return [
    base(argv.mode),
    merge(base(argv.mode), {
      entry: path.resolve(__dirname, 'src', 'assign.ts'),
      output: {
        filename: isProd ? 'three-vmd.min.js' : `three-vmd.js`,
        library: '__three_vmd__',
        libraryTarget: 'var',
      },
      externals: {
        three: 'THREE',
      },
    }),
  ]
}
