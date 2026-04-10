const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions for expo-sqlite web support
// Remove wasm from sourceExts if present, and add to assetExts
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'wasm'
);
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
