var webpack = require('webpack');
var path = require('path');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
var DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var BUILD_DIR = path.resolve(__dirname, 'src/client/public');
var APP_DIR = path.resolve(__dirname, 'src/client/app');
const devMode = process.env.NODE_ENV !== 'production'

/* What to build */

const app_entry = {
  app: APP_DIR + '/app.js'
};

/* Configuration */

const default_modules = {
  rules: [
    {
      test : /\.(jsx|js)?/,
      include : APP_DIR,
      loader : 'babel-loader'
    },
    {
      test: /\.(css|scss)$/,
      use: [{
        loader: "style-loader" // creates style nodes from JS strings
      }, {
        loader: "css-loader" // translates CSS into CommonJS
      }, {
        loader: "sass-loader" // compiles Sass to CSS
      }]
    },
    {
      test: /\.(png|woff|woff2|eot|ttf|jp(e*)g|svg|gif)$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 8000, // Convert images < 8kb to base64 strings
          name: 'images/[hash]-[name].[ext]'
        }
      }]
    },
    {
      test: /\.less$/,
      use: [{
        loader: 'style-loader'
      }, {
        loader: 'css-loader'
      }, {
        loader: 'less-loader', options: {
          strictMath: false,
          noIeCompat: true,
          javascriptEnabled: true
        }
      }]
    },
  ]
};
const default_plugins = [
  new MiniCssExtractPlugin({
    filename: devMode ? '[name].css' : '[name].[hash].css',
    chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
  }),
  new DuplicatePackageCheckerPlugin(),
  //new BundleAnalyzerPlugin(),
  new webpack.optimize.AggressiveMergingPlugin({
    minSizeReduce: 1.5
  })
];
const default_resolve = {
  alias: {
    models :  path.resolve(__dirname, 'src/client/app/models'),
    scenes :  path.resolve(__dirname, 'src/client/app/scenes'),
    apps :  path.resolve(__dirname, 'src/client/app/scenes/Apps'),
    components :  path.resolve(__dirname, 'src/client/app/components'),
    lib :  path.resolve(__dirname, 'src/client/app/lib'),
    services :  path.resolve(__dirname, 'src/client/app/services'),
    constants :  path.resolve(__dirname, 'src/client/app/constants'),
  },
  extensions: ['.js', '.jsx', '.json', '.scss']
};

module.exports = {
  name: "app",
  entry: app_entry,
  output: {
    path: BUILD_DIR,
    filename: '[name].js'
  },
  externals: {
    child_process: 'child_process'
  },
  plugins: default_plugins,
  resolve: default_resolve,
  module : default_modules,
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
			  	chunks: "initial",
					minChunks: 2,
					maxInitialRequests: 5, // The default limit is too small to showcase the effect
					minSize: 0 // This is example is too small to create commons chunks
				},
				vendor: {
					test: /node_modules/,
					chunks: "initial",
					name: "login~app~vendor",
					priority: 10,
					enforce: true
				}
      }
    }
  }
};
