const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add custom webpack configuration
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native-worklets': false,
    'react-native-worklets/plugin': false,
    'react-native-reanimated': false,
    // Redirect all react-native-vector-icons imports to @expo/vector-icons
    'react-native-vector-icons/MaterialCommunityIcons': '@expo/vector-icons/MaterialIcons',
    'react-native-vector-icons/MaterialIcons': '@expo/vector-icons/MaterialIcons',
  };

  // Ignore problematic modules for web
  config.resolve.fallback = {
    ...config.resolve.fallback,
    'react-native-worklets': false,
    'react-native-reanimated': false,
  };

  // Add NormalModuleReplacementPlugin to handle dynamic requires
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /@react-native-vector-icons\/material-design-icons/,
      '@expo/vector-icons/MaterialIcons'
    ),
    new webpack.IgnorePlugin({
      resourceRegExp: /react-native-worklets/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /react-native-reanimated/,
    })
  );

  return config;
};