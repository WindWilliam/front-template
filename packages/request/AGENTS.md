# PACKAGES/REQUEST — AGENTS.MD

**HTTP 请求客户端** (@front-template/request)
基于 axios 的全功能请求管理包，支持拦截器、缓存、重试、并发控制和取消请求。

## STRUCTURE

```
request/
├── index.ts              # 统一导出所有 API
├── package.json          # 包配置，依赖 axios
├── tsconfig.json         # TS 配置 (继承 config/tsconfig/base)
├── eslint.config.ts      # ESLint 配置 (继承 config/eslint/base)
├── lint-staged.config.ts # 暂存文件钩子规则
├── .prettierrc.ts        # Prettier 配置 (继承 config/prettier/base)
└── src/
    ├── types.ts          # ApiResponse, RequestConfig, RequestError 类型定义
    ├── HttpClient.ts     # 核心客户端类 + http 默认实例
    ├── interceptors.ts   # 请求拦截(Token) / 响应拦截(错误处理)
    ├── cache.ts          # 请求缓存管理器 (TTL)
    ├── retry.ts          # 指数退避重试机制
    ├── concurrency.ts    # 并发控制器
    └── cancel.ts         # 基于 AbortController 的请求取消
```

## WHERE TO LOOK

| 任务           | 文件                | 说明                               |
| -------------- | ------------------- | ---------------------------------- |
| 修改请求配置   | src/HttpClient.ts   | HttpClientOptions, 默认超时/并发数 |
| 添加拦截器逻辑 | src/interceptors.ts | Token 注入、错误处理、业务码处理   |
| 调整缓存策略   | src/cache.ts        | TTL 计算、缓存 key 生成规则        |
| 修改重试逻辑   | src/retry.ts        | 退避策略、最大重试次数             |
| 调整并发限制   | src/concurrency.ts  | 默认最大并发数 (当前 6)            |
| 使用请求客户端 | index.ts            | 导出 http 实例和 HttpClient 类     |

## CONVENTIONS

- **工厂模式**: HttpClient 类可实例化，也可使用默认 http 实例
- **配置继承**: 所有 lint/format 配置继承自 `@front-template/config`
- **类型优先**: 所有配置选项都有完整 TypeScript 类型定义

## ANTI-PATTERNS

- **不要直接修改 http 实例的配置** — 使用 `new HttpClient(options)` 创建新实例
- **不要在拦截器中引入 UI 依赖** — 错误处理使用 console，UI 提示在应用层处理
- **不要缓存非幂等请求** — POST/PUT/DELETE 默认不启用缓存
- **并发控制是全局的** — 所有 HttpClient 实例共享同一个 concurrency 控制器

## USAGE

```typescript
import { http, HttpClient, type ApiResponse } from '@front-template/request'

// 默认实例
const res = await http.get<UserData>('/api/user', { id: 1 })

// 自定义实例
const api = new HttpClient({
  baseURL: 'https://api.example.com',
  timeout: 15_000,
  maxConcurrent: 10,
})

// 高级配置
const data = await api.post('/api/data', payload, {
  cache: 5 * 60 * 1000, // 缓存 5 分钟
  retry: 3,
  retryDelay: 500,
})
```

## COMMANDS

```bash
pnpm lint           # ESLint 检查
pnpm lint:fix       # ESLint 自动修复
pnpm format         # Prettier 格式化
```

## NOTES

- 依赖 axios ^1.13.2
- 默认超时 10s，默认最大并发 6
- Token 从 localStorage 读取 (key: 'token')
- 业务错误码：0 和 200 视为成功，其他触发错误处理
