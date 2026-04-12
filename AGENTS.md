# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-12
**Commit:** 5030f40
**Branch:** main

## OVERVIEW

前端脚手架模板 (front-template)，面向 Vue3/React 项目。pnpm workspaces monorepo + Turbo 跨包调度。提供统一的 ESLint/Prettier/Stylelint/TSConfig 配置包。

## STRUCTURE

```
front-template/
├── apps/                    # 应用入口（当前为空，预留）
├── packages/
│   ├── config/              # 共享配置包 (@front-template/config)
│   └── core/                # 核心包（当前为空，预留）
├── package.json             # 根配置，ESLint/Prettier/Husky/Lint-staged 依赖
├── pnpm-workspace.yaml      # workspace 定义: packages/*, apps/*, 根目录
├── turbo.json               # Turbo 任务编排 (dev, lint:fix, lint:staged, test)
├── eslint.config.ts          # 根 ESLint（跳过 packages/, apps/）
├── commitlint.config.ts      # 提交信息规范 (config-conventional)
├── lint-staged.config.ts     # 暂存文件钩子规则
└── .husky/                  # Git hooks (commit-msg, pre-commit)
```

## WHERE TO LOOK

| Task         | Location                         | Notes                                             |
| ------------ | -------------------------------- | ------------------------------------------------- |
| 跨包任务调度 | turbo.json                       | 定义 dev, lint:fix, lint:staged, test 四个 task   |
| 共享配置包   | packages/config/                 | 所有 lint/format/tsconfig 配置中心                |
| ESLint 基础  | packages/config/eslint/base.ts   | `extendBaseLint()` 工厂函数                       |
| ESLint React | packages/config/eslint/react.ts  | `extendReactLint()`                               |
| ESLint Vue   | packages/config/eslint/vue.ts    | `extendVueLint()`                                 |
| Prettier     | packages/config/prettier/base.ts | `basePrettier` 默认配置                           |
| Stylelint    | packages/config/stylelint/       | base.json + vue.json                              |
| TSConfig     | packages/config/tsconfig/        | base/node/react/vue/tool/web 6 种预设             |
| Git hooks    | .husky/                          | commit-msg → commitlint; pre-commit → lint-staged |
| 工作区定义   | pnpm-workspace.yaml              | includes: packages/_, apps/_, "."                 |

## CODE MAP

| Symbol            | Type    | Location                          | Role                                               |
| ----------------- | ------- | --------------------------------- | -------------------------------------------------- |
| extendBaseLint()  | factory | packages/config/eslint/base.ts    | 创建 ESLint 基础配置 + TS + Prettier               |
| extendReactLint() | factory | packages/config/eslint/react.ts   | React 项目 ESLint                                  |
| extendVueLint()   | factory | packages/config/eslint/vue.ts     | Vue 项目 ESLint                                    |
| basePrettier      | const   | packages/config/prettier/base.ts  | Prettier 默认选项 (80 char, 2 spaces, singleQuote) |
| extendBaseReact() | factory | packages/config/prettier/react.ts | React 风格覆盖                                     |
| extendBaseVue()   | factory | packages/config/prettier/vue.ts   | Vue 风格覆盖                                       |

## CONVENTIONS

- **ESM only**: `"type": "module"` in root + all packages
- **No semicolons**: prettier semi: false
- **Single quotes**: prettier singleQuote: true
- **printWidth: 80**: narrow line width
- **TS configs in JSON**: tsconfig 预设用 .json, lint 配置用 .ts

## ANTI-PATTERNS (THIS PROJECT)

- **Don't add deps to root package.json** unless used at workspace level
- **Don't ignore packages/ or apps/ in root eslint.config.ts** root eslint 跳过 packages 和 apps，各包自行配置
- **Don't modify .prettierrc.ts at root** 它指向 `@front-template/config` 的 prettier 配置
- **Don't remove turbo.json cache:false** on persistent tasks (dev) is intentional
- **packages/config/index.ts 只导出 eslint** prettier 导出被注释 (index.ts: `export * from './prettier/index'` 已注释，原因："用不了ts格式")

## UNIQUE STYLES

- Config package 使用 **工厂函数模式** (`extendBaseLint`, `extendReactLint`) 而非直接导出配置对象
- Root eslint 配置**主动忽略** `packages/` 和 `apps/` — 各子包自行负责 lint
- Turbo tasks 中 `dev` 和 `lint:fix` 禁用缓存; `test` 使用默认缓存
- `preferFrozenLockfile: true` + `strictDependents: true` in pnpm-workspace
- `.npmrc` 存在但需检查内容
- `test.ts` 在根目录为 untracked 文件（开发中的测试）

## COMMANDS

```bash
pnpm i                                    # 安装依赖
pnpm turbo run <target>                   # 运行 turbo task
pnpm turbo run <target> -w                # 包含根目录执行
pnpm lint                                 # ESLint 根目录
pnpm lint:fix                             # ESLint --fix
pnpm format                               # Prettier --write .
pnpm stylelint                            # Stylelint (CSS/SCSS/Vue)
pnpm test                                 # 根占位符，具体包内执行对应测试
```

## NOTES

- `packages/core/` 和 `apps/` 当前为空 — 预留扩展
- `packageManager: "pnpm@10.33.0"` — 必须用 pnpm >= 10.33.0
- Node.js 22.22.2 通过 pnpm-workspace 的 `useNodeVersion` 锁定
- `@changesets/cli` 已安装但未配置 changesets — 版本发布基础设施已就位
- Git commit message 约定: conventional commits (@commitlint/config-conventional)
- Husky v9 + Lint-staged → pre-commit 自动 format+lint
