import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import pluginQuery from '@tanstack/eslint-plugin-query'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-lib', 'ds-bundle', '.ds-sync', '.design-sync/.cache']),
  // Luật khuyến nghị của TanStack Query (queryKey đủ phụ thuộc, không dùng sai useQuery…)
  ...pluginQuery.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Component shadcn sinh ra export cả biến/hàm (vd. buttonVariants)
    files: ['src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
