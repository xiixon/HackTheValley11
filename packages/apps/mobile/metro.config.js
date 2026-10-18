const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Shared code lives outside this app and is not a package-manager workspace.
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../../shared')];

module.exports = config;
