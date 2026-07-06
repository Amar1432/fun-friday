import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import baseConfig from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export const nextConfig = defineConfig([
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
]);

export default nextConfig;
