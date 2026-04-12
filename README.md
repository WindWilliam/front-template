# front-template

front template by wind

## 中文简介

这是一个基于单体仓库（monorepo）的前端模版，使用 pnpm workspaces 和 turbo 进行跨包管理。包含了根目录配置、以及属于 `packages/*` 和 `apps/*` 的多个包/应用，方便快速搭建前端原型和统一维护脚手架。

## 快速开始

- 安装依赖：`pnpm i`
- 运行工作流中的任务：`pnpm turbo run <target>`（在仓库根目录执行；如需跨包执行，使用 `-w` 或从根执行）
- 常用脚本：
- `pnpm lint` — 运行代码和样式检查
- `pnpm format` — 自动格式化代码
- `pnpm test` — 运行测试（根脚本为占位符，具体包内测试请查看各包中的脚本）
- `pnpm build` — 构建输出（如有定义）

## 项目结构

- 根目录包含：`pnpm-workspace.yaml`、`package.json`、`README.md`、以及其他配置
- 业务代码分布在 `packages/*` 和 `apps/*`
- 根目录及工作区会由 Turbo 进行跨包任务调度

## 常用脚本与工具

- 依赖管理：`pnpm i`
- 单包/全局命令：`pnpm -w <script>`，如 `pnpm -w turbo run build`
- 代码检查：`pnpm lint`
- 代码格式化：`pnpm format`
- 测试：`pnpm test`
- 构建：`pnpm build`

## 贡献

- 提交前请确保通过 lint/format/测试（若存在 per-package 测试，请在对应包内执行）
- 使用小、可回滚的改动，优先用补丁提交（patch），避免大规模改动。
- 如需与他人协作，请使用分支和清晰的提交信息。
