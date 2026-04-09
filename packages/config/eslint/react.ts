import { defineConfig } from 'eslint/config'
import tsEslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

type ConfigParams = Parameters<typeof defineConfig>

/**
 * 扩展 ESLint 配置，添加 React 相关的规则
 * @param {ConfigParams} config - 自定义 ESLint 配置规则数组，默认为空数组
 * @returns {ReturnType<typeof defineConfig>} - 生成的 ESLint 配置对象
 *
 * @description
 * 此函数用于创建包含 React 项目所需的 ESLint 配置，
 * 包括基础的 TypeScript 规则和 Prettier 集成。
 */
export function extendReactLint(config: ConfigParams = []) {
  // 构建基础 ESLint 配置数组
  const baseLint: ConfigParams = [
    {
      // 忽略不需要 lint 的目录
      ignores: ['node_modules', 'dist'],
    },

    tsEslint.configs.recommended, // TypeScript 推荐规则
    ...config, // 合并用户自定义规则
    // eslint-plugin-react：提供 React 相关的 lint 规则

    eslintConfigPrettier, // 最后应用 prettier 配置，确保与 Prettier 兼容
  ]

  // 使用 defineConfig 生成最终的 ESLint 配置
  return defineConfig(baseLint)
}
