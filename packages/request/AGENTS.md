# PACKAGES/REQUEST — AGENTS.MD

**HTTP 请求客户端** (@front-template/request)
基于 axios 的全功能请求管理包，支持自定义响应格式、拦截器、缓存、重试、并发控制和取消请求。

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
    ├── types.ts          # 类型定义 (ResponseConfig, SuccessCodeConfig, ApiResponse 等)
    ├── HttpClient.ts     # 核心客户端类 + http 默认实例
    ├── interceptors.ts   # 拦截器注册、响应处理、数据提取
    ├── cache.ts          # 请求缓存管理器 (TTL)
    ├── retry.ts          # 指数退避重试机制
    ├── concurrency.ts    # 并发控制器
    └── cancel.ts         # 基于 AbortController 的请求取消
```

## WHERE TO LOOK

| 任务           | 文件                | 说明                                           |
| -------------- | ------------------- | ---------------------------------------------- |
| 修改请求配置   | src/HttpClient.ts   | HttpClientOptions 配置项                       |
| 自定义响应格式 | src/types.ts        | ResponseConfig, SuccessCodeConfig              |
| 自定义拦截器   | src/interceptors.ts | registerInterceptors, setupResponseInterceptor |
| 调整缓存策略   | src/cache.ts        | TTL 计算、缓存 key 生成规则                    |
| 修改重试逻辑   | src/retry.ts        | 退避策略、最大重试次数                         |
| 调整并发限制   | src/concurrency.ts  | 默认最大并发数 (当前 6)                        |

## CONVENTIONS

- **全局实例优先**: 大部分内部 API 共用拦截器，使用全局实例 + 动态 URL
- **第三方 API 新实例**: 不同拦截器/响应格式时，创建新实例
- **API 服务类封装**: 将接口调用封装在服务类中，隐藏 URL 细节
- **默认仅 HTTP 错误处理**: 状态码、超时、取消请求

## ANTI-PATTERNS

- **不要每次请求都 new HttpClient** — 内部 API 用全局实例，第三方 API 按需创建
- **不要在拦截器中引入 UI 依赖** — 错误处理使用 console，UI 提示在应用层处理
- **不要缓存非幂等请求** — POST/PUT/DELETE 默认不启用缓存
- **拦截器顺序很重要** — 自定义拦截器在默认拦截器之后注册

## USAGE

### 推荐：全局实例 + API 服务类封装

大部分内部 API 共用拦截器（如 Token 注入），使用全局实例 + 动态 URL：

```typescript
import { HttpClient } from '@front-template/request'

// 1. 创建全局实例（应用启动时配置一次）
export const http = new HttpClient({
  baseURL: '/api', // 内部 API 基础路径
  timeout: 10_000,
  response: {
    successCodes: [0],
    extractData: (res) => res.data.data,
  },
  interceptors: {
    request: (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
  },
})

// 2. API 服务类封装（使用全局实例）
class UserService {
  async getUser(id: number) {
    return http.get<UserData>('/user/' + id)
  }

  async updateUser(id: number, data: Partial<UserData>) {
    return http.put<UserData>('/user/' + id, data)
  }

  async deleteUser(id: number) {
    return http.delete<void>('/user/' + id)
  }

  async getList(page: number) {
    return http.get<{ list: User[]; total: number }>('/user/list', { page })
  }
}

class OrderService {
  async getOrders(page: number, size: number) {
    return http.get<{ list: Order[]; total: number }>('/order/list', {
      page,
      size,
    })
  }

  async createOrder(data: CreateOrderDto) {
    return http.post<Order>('/order', data)
  }
}

// 3. 导出服务实例
export const userService = new UserService()
export const orderService = new OrderService()

// 4. 使用
const user = await userService.getUser(1)
const orders = await orderService.getOrders(1, 10)
```

### 第三方 API：创建新实例

第三方服务拦截器/响应格式不同，创建独立实例：

```typescript
import { HttpClient } from '@front-template/request'

// 第三方支付（无 Token，不同响应格式）
export const paymentHttp = new HttpClient({
  baseURL: 'https://payment.example.com',
  timeout: 30_000,
  response: {
    successCodes: (res) => res.data.status === 'SUCCESS',
    extractData: (res) => res.data.result,
    extractError: (res) => ({
      code: res.data.status,
      message: res.data.errorMessage,
    }),
  },
  // 无 request interceptor（不需要 Token）
})

class PaymentService {
  async pay(orderId: string, amount: number) {
    return paymentHttp.post<PaymentResult>('/pay', { orderId, amount })
  }

  async query(orderId: string) {
    return paymentHttp.get<PaymentStatus>('/query/' + orderId)
  }
}

export const paymentService = new PaymentService()
```

### 默认实例（仅 HTTP 错误处理）

```typescript
import { http } from '@front-template/request'

// 默认实例不做业务响应处理，直接返回 response.data
const data = await http.get<UserData>('/api/user', { id: 1 })
```

### 自定义响应格式配置

```typescript
// 分页响应: { code: 0, records: [], total: 100 }
export const http = new HttpClient({
  response: {
    extractData: (res) => ({
      list: res.data.records,
      total: res.data.total,
    }),
  },
})

// 使用
const { list, total } = await http.get<{ list: Item[]; total: number }>('/list')

// 成功码为 [0, 1, 200]
export const http = new HttpClient({
  response: {
    successCodes: [0, 1, 200], // 或函数: (res) => res.data.code >= 0
  },
})

// 响应直接返回 data（无包装）
export const http = new HttpClient({
  response: {
    successCodes: (res) => true, // 所有响应视为成功
    extractData: (res) => res.data,
  },
})

// 自定义错误提取: { status: 'fail', error: '用户不存在' }
export const http = new HttpClient({
  response: {
    successCodes: (res) => res.data.status === 'success',
    extractError: (res) => {
      if (res.data.status !== 'success') {
        return { code: res.data.status, message: res.data.error }
      }
      return null
    },
  },
  businessErrorMap: { fail: '请求失败', error: '系统错误' },
})
```

### 完整配置示例

```typescript
import { HttpClient } from '@front-template/request'

// 应用全局 HTTP 客户端
export const http = new HttpClient({
  baseURL: '/api',
  timeout: 15_000,
  maxConcurrent: 10,
  errorMap: { 503: '服务维护中', 502: '网关异常' },
  response: {
    successCodes: [0],
    extractData: (res) => res.data.data,
    extractError: (res) => {
      if (res.data.code !== 0) {
        return { code: res.data.code, message: res.data.message }
      }
      return null
    },
  },
  businessErrorMap: { 10001: 'Token 已过期', 10002: '权限不足' },
  interceptors: {
    request: (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    response: (response) => {
      // 可选：响应日志
      console.log(`[API] ${response.config.url}`, response.data)
      return response
    },
  },
})
```

### 单请求级响应配置（方案1）

同一实例兼容不同响应格式，通过 `response` 单请求级配置覆盖全局：

```typescript
// 全局配置：标准格式 { code: 0, data: T }
export const http = new HttpClient({
  response: {
    successCodes: [0],
    extractData: (res) => res.data.data,
  },
})

// 单条数据（使用全局配置）
const user = await http.get<User>('/user/1')

// 分页数据（单请求级配置覆盖）
const { list, total } = await http.get<{ list: Order[]; total: number }>(
  '/order/list',
  { page: 1 },
  {
    response: {
      extractData: (res) => ({ list: res.data.records, total: res.data.total }),
    },
  }
)

// 第三方接口（单请求级配置）
const data = await http.post<ThirdPartyResult>('/third-party/api', payload, {
  response: {
    successCodes: (res) => res.data.status === 'SUCCESS',
    extractData: (res) => res.data.result,
    extractError: (res) => ({ code: res.data.status, message: res.data.error }),
  },
})
```

### 动态判断响应格式（方案3）

全局 `extractData` 自动判断不同格式：

```typescript
export const http = new HttpClient({
  response: {
    successCodes: [0],
    extractData: (res) => {
      const data = res.data

      // 分页格式: { code, records, total }
      if (data.records !== undefined) {
        return { list: data.records, total: data.total }
      }

      // 单条格式: { code, data }
      if (data.data !== undefined) {
        return data.data
      }

      // 直接返回（无包装）
      return data
    },
  },
})

// 所有接口统一使用，自动适配
const user = await http.get<User>('/user/1')
const { list, total } = await http.get<{ list: Order[]; total: number }>(
  '/order/list'
)
const raw = await http.get<RawData>('/external/data')
```

**方案对比：**

| 场景                   | 推荐方案                   |
| ---------------------- | -------------------------- |
| 少量接口格式不同       | 方案1（单请求级 response） |
| 大量接口格式可自动判断 | 方案3（动态判断）          |
| 第三方 API             | 方案1（单请求级 response） |

### 单请求级配置

某些请求需要特殊处理（如文件下载），可在请求配置中设置：

```typescript
// 文件下载（GET）
const blob = await http.download('/file/report.pdf', { type: 'pdf' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'report.pdf'
a.click()

// 文件下载（POST，提交筛选条件导出）
const blob = await http.download(
  '/export/orders',
  { status: 'paid', date: '2024-01' },
  { method: 'POST' }
)

// 后台报错自动解析（返回 JSON 而非 blob）
try {
  const blob = await http.download('/file/export')
} catch (e) {
  if (e instanceof RequestError) {
    console.error(e.message) // '导出失败：数据量过大'
  }
}

// 或使用 rawRequest 自定义
const res = await http.rawRequest<Blob>({
  url: '/file/export.xlsx',
  responseType: 'blob',
})

// 文件上传（FormData 或 File）
const formData = new FormData()
formData.append('file', file)
formData.append('type', 'avatar')
const result = await http.upload<{ url: string }>('/file/upload', formData)

// 或直接传 File
const result = await http.upload<{ url: string }>('/file/upload', file)

// 单请求跳过业务错误（保留 HTTP 错误处理）
const data = await http.get<RawData>(
  '/external/data',
  {},
  {
    skipBusinessError: true,
  }
)

// 单请求返回原始响应（跳过所有拦截）
const response = await http.get<RawResponse>(
  '/raw/api',
  {},
  {
    rawResponse: true,
  }
)
```

### RequestConfig 配置项

| 配置项              | 类型      | 说明                          |
| ------------------- | --------- | ----------------------------- | -------------------------------- | ------- | -------- |
| `cache`             | `boolean  | number`                       | 是否启用缓存，number 为 TTL (ms) |
| `retry`             | `number`  | 重试次数                      |
| `retryDelay`        | `number`  | 重试延迟 (ms)                 |
| `skipErrorHandler`  | `boolean` | 跳过 HTTP 错误处理            |
| `skipBusinessError` | `boolean` | 跳过业务错误拦截（保留 HTTP） |
| `rawResponse`       | `boolean` | 返回原始响应，跳过所有拦截    |
| `responseType`      | `'blob'   | 'arraybuffer'                 | 'json'                           | 'text'` | 响应类型 |
| `timeout`           | `number`  | 单请求超时 (ms)               |

### 特殊方法

| 方法                            | 说明                                    |
| ------------------------------- | --------------------------------------- |
| `download(url, data?, config?)` | 文件下载，返回 Blob，自动解析 JSON 错误 |
| `upload(url, file, config?)`    | 文件上传，支持 File 或 FormData         |
| `rawRequest(config)`            | 原始请求，返回 AxiosResponse            |

## COMMANDS

```bash
pnpm lint           # ESLint 检查
pnpm lint:fix       # ESLint 自动修复
pnpm format         # Prettier 格式化
```

## NOTES

- 依赖 axios ^1.13.2
- 默认超时 10s，默认最大并发 6
- **推荐模式**: 全局实例 + API 服务类封装（内部 API）；新实例（第三方 API）
- `successCodes`: 数组 `[0, 200]` 或函数 `(response) => boolean`
- `extractData`: 从响应提取最终数据，默认返回 `response.data`
- `extractError`: 从响应提取错误信息，返回 `{ code, message } | null`
- HTTP 错误 (`errorMap`) 和业务错误 (`businessErrorMap`) 分开配置
- 内存消耗: 单实例 ~几KB，内部 API 共用一个实例即可，第三方 API 按需创建
