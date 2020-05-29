const path = require('path');
const custom = require('../webpack.common.js');


module.exports = async ({ config, mode }) => {
  config.module.rules = (config.module.rules || []).concat(custom.module.rules);
  config.resolve.alias = custom.resolve.alias;

  config.module.rules.push({
    test: /\.stories\.jsx?$/,
    loaders: [require.resolve('@storybook/addon-storysource/loader')],
    enforce: 'pre',
  });

  var externals = {
    'jsdom': 'window',
    'cheerio': 'window',
    'react/lib/ExecutionEnvironment': true,
    'react/lib/ReactContext': 'window',
    'react/addons': true,
  };
  config.externals = config.externals || {};
  Object.keys(externals).forEach((key)=>{
    config.externals[key] = externals[key];
  })

  return config;
};
