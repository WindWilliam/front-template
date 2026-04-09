import { defineConfig } from 'eslint/config'
import tsEslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

type ConfigParams = Parameters<typeof defineConfig>

/**
 * 扩展 ESLint 基础配置
 * @param {ConfigParams} config - 自定义 ESLint 配置规则数组，默认为空数组
 * @returns {ReturnType<typeof defineConfig>} - 生成的 ESLint 配置对象
 *
 * @description
 * 此函数用于创建包含基础 ESLint 配置，
 * 包括 TypeScript 规则和 Prettier 集成，适用于所有类型的项目。
 */
export function extendBaseLint(config: ConfigParams = []) {
  // 构建基础 ESLint 配置数组
  const baseLint: ConfigParams = [
    {
      // 忽略不需要 lint 的目录
      ignores: ['node_modules', 'dist'],
    },

    // js.configs.recommended, // JS 文件规则，依赖@eslint/js
    tsEslint.configs.recommended, // TypeScript 推荐规则
    ...config, // 合并用户自定义规则

    eslintConfigPrettier, // 最后应用 prettier 配置，确保与 Prettier 兼容
  ]

  // 使用 defineConfig 生成最终的 ESLint 配置
  return defineConfig(baseLint)
}
