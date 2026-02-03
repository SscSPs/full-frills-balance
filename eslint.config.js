// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@/src/features/*/*',
            '@/src/features/*/**',
            '@/src/components/**',
            '@/src/services/**',
            '@/src/data/**',
            '@/src/utils/**',
            '@/src/hooks/**',
            '@/src/contexts/**',
            '@/src/constants/**',
            '@/src/types/**',
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['app/*', 'app/**', '@/app', '@/app/*', '@/app/**'],
        },
      ],
    },
  },
]);
