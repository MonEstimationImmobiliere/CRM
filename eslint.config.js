import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import vueParser from 'vue-eslint-parser';

export default [
  // Ignore patterns - put first to avoid processing these files
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

  // Base configuration for JavaScript
  js.configs.recommended,

  // Vue.js configuration
  ...vue.configs['flat/essential'],

  // TypeScript configuration for JS/TS files only
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{js,ts,mjs,cjs}'],
  })),

  // Prettier configuration (should be last)
  prettier,

  // Configuration for JS/TS files
  {
    files: ['**/*.{js,ts,mjs,cjs}'],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      // Prettier rules
      'prettier/prettier': 'error',

      // Console and debugger rules
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        { argsIgnorePattern: '^_' },
      ],
    },
  },

  // Configuration for Vue files
  {
    files: ['**/*.vue'],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        global: 'readonly',
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
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
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
];
