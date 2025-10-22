import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import typescript from '@vue/eslint-config-typescript';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  // Base configuration for JavaScript
  js.configs.recommended,

  // Vue.js configuration
  ...vue.configs['flat/essential'],

  // TypeScript configuration
  ...typescript(),

  // Prettier configuration (should be last)
  prettier,

  {
    files: ['**/*.{js,ts,vue}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Prettier rules
      'prettier/prettier': 'error',

      // Console and debugger rules
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

      // Vue specific rules
      'vue/no-deprecated-slot-attribute': 'off',
      'vue/multi-word-component-names': 'off',

      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  },

  // Ignore patterns
  {
    ignores: [
      // Dossiers système
      '.DS_Store',
      'node_modules/**',

      // Dossiers de build et coverage
      'coverage/**',
      'dist/**',

      // Dossiers mobiles
      'ios/**',
      'android/**',

      // Fichiers d'environnement local
      '.env.local',
      '.env.*.local',

      // Fichiers de log
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',

      // Dossiers et fichiers d'éditeur
      '.idea/**',
      '.vscode/**',
      '*.suo',
      '*.ntvs*',
      '*.njsproj',
      '*.sln',
      '*.sw?',

      // Fichiers spécifiques au projet
      'public/**',
      'capacitor.config.ts',
      'vite.config.ts',
    ],
  },
];
