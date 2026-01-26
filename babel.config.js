module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Decorators first (legacy required by WatermelonDB)
      ['@babel/plugin-proposal-decorators', { legacy: true }],

      // React Compiler (must run early)
      ['babel-plugin-react-compiler', { target: '18' }],

      // MUST be last
      'react-native-reanimated/plugin',
    ],
    overrides: [
      {
        test: /src\/data\/models\/.*\.ts$/,
        plugins: [
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-private-methods', { loose: true }],
          ['@babel/plugin-transform-private-property-in-object', { loose: true }],
        ],
      },
    ],
  };
};
