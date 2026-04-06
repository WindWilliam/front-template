import { defineConfig } from 'eslint/config';
import tsEslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig([
  {
    ignores: ['node_modules', 'dist', '.turbo', '.pnpm-store'],
  },
  // js.configs.recommended, // JS 文件规则，依赖@eslint/js
  tsEslint.configs.recommended,
  // eslint-plugin-vue：提供 Vue SFC 文件 .vue 的 lint 规则
  // eslint-plugin-react、eslint-plugin-react-hooks：提供 React [hooks] 规则
  eslintConfigPrettier, // 最后应用 prettier 配置
]);
