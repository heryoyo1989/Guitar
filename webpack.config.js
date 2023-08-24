const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.jsx',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/'
  },
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    proxy: {
      '/':'http://localhost:3000'
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Guitar',
    }),
  ],
  module: {
    rules: [
        {
          test:/\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        { 
          test: /\.(png|jp(e*)g|svg|gif)$/i, 
          type: 'asset/resource',
          // use: 'file-loader', 
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        {
          test:/\.(vs|fs)$/i,
          use: 'raw-loader'
        }
    ],
  },
  resolve: {
    extensions: [".jsx", ".js"],
  }
};