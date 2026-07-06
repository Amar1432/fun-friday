import eslint from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/out/**',
      '**/coverage/**',
      '**/.turbo/**',
      'next-env.d.ts',
    ],
  },
  eslint.configs.recommended,
  {
    rules: {
      'no-console': 'warn',
    },
  },
];

export default baseConfig;
