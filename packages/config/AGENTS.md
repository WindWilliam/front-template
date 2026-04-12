# PACKAGES/CONFIG — AGENTS.MD

**Shared 基础配置包** (@front-template/config)
所有 lint/format/tsconfig 预设的单一来源。

## STRUCTURE

```
config/
├── index.ts              # 入口，仅导出 eslint（prettier 被注释）
├── eslint/
│   ├── base.ts           # extendBaseLint() 工厂
│   ├── react.ts          # extendReactLint() 工厂
│   ├── vue.ts            # extendVueLint() 工厂
│   └── index.ts          # 统一导出
├── prettier/
│   ├── base.ts           # basePrettier 默认配置
│   ├── react.ts          # reactPrettier（当前仅继承 base）
│   ├── vue.ts            # vuePrettier（当前仅继承 base）
│   └── index.ts          # 统一导出（但根 index.ts 未引用）
├── stylelint/
│   ├── base.json         # 基础 CSS/SCSS 规则
│   └── vue.json          # Vue SFC 额外规则
└── tsconfig/
    ├── base.json         # ES2020 + Bundler + Strict
    ├── node.json         # Node.js 目标
    ├── web.json          # 浏览器目标
    ├── react.json        # React JSX
    ├── vue.json          # Vue SFC
    └── tool.json         # 工具/构建设置
├── tsconfig.json          # 包级配置 (extends tool.json, composite: true)
├── eslint.config.ts       # 包的 ESLint 配置 (引用 @front-template/config)
├── lint-staged.config.ts  # 暂存文件钩子规则
├── .prettierrc.ts         # Prettier 配置 (指向 base)
└── .prettierignore
```

## WHERE TO LOOK

| 任务                 | 文件                             | 说明                                      |
| -------------------- | -------------------------------- | ----------------------------------------- |
| 添加新 ESLint 规则   | eslint/base.ts + eslint/index.ts | 工厂函数模式，接受 ConfigParams 参数      |
| 修改 Prettier 默认值 | prettier/base.ts                 | 全局生效 (80 char, no semi, single quote) |
| 修改 TS 基础预设     | tsconfig/base.json               | target: ES2020, module: Bundler           |
| 修改 Stylelint       | stylelint/base.json + vue.json   | JSON 格式                                 |

## CONVENTIONS

- **TypeScript 配置为 JSON** (.json)，lint 配置为 TypeScript (.ts) 工厂
- Prettier 基座: printWidth 80, semi false, singleQuote true, EOL lf

## ANTI-PATTERNS

- **不要用 `require()`** — ESM only (`"type": "module"`)
- **不要直接修改 prettier/index.ts 的导出** — 当前已注释 prettier 导出 (`index.ts:4`)，根包无法导入
- **不要在 tsconfig JSON 中添加注释** — JSON 不支持注释
- 工厂函数参数: `ConfigParams = Parameters<typeof defineConfig>`
- prettier/index.ts 导出了 prettier/react/vue 但根 index.ts 只引用了 eslint，新增框架需同步更新两处
