const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure sourceExts includes the correct extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Add asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg',
];

module.exports = config;
