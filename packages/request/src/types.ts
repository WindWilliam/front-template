import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

/** 标准 API 响应格式（可选，仅供参考） */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

/** 分页响应格式（可选，仅供参考） */
export interface PaginatedResponse<T = unknown> {
  code: number
  message: string
  records: T[]
  total: number
}

/** 请求配置扩展 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否启用缓存 */
  cache?: boolean | number
  /** 重试次数 */
  retry?: number
  /** 重试延迟 (ms) */
  retryDelay?: number
  /** 是否跳过全局错误处理（HTTP 错误） */
  skipErrorHandler?: boolean
  /** 是否跳过业务错误拦截（保留 HTTP 错误处理） */
  skipBusinessError?: boolean
  /** 是否返回原始响应（跳过 extractData 和所有拦截逻辑） */
  rawResponse?: boolean
  /** 自定义超时 (ms) */
  timeout?: number
  /** 单请求级响应配置（覆盖全局配置） */
  response?: Partial<ResponseConfig>
}

/** 缓存条目 */
export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
}

/** 错误码映射 */
export type ErrorMapper = Record<number, string>

/** 默认 HTTP 错误码 */
export const DEFAULT_HTTP_ERROR_MAP: ErrorMapper = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求不存在',
  408: '请求超时',
  500: '服务器错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
}

/** 成功码判断方式 */
export type SuccessCodeConfig =
  | number[]
  | ((response: AxiosResponse) => boolean)

/** 从响应提取数据的函数 */
export type ResponseDataExtractor<T = unknown> = (response: AxiosResponse) => T

/** 从响应提取错误信息的函数，返回 null 表示成功 */
export type ResponseErrorExtractor = (
  response: AxiosResponse
) => { code: unknown; message: string } | null

/** 响应处理配置 */
export interface ResponseConfig {
  /** 成功码配置（默认 [0, 200]） */
  successCodes?: SuccessCodeConfig
  /** 从响应提取数据（默认提取 response.data.data） */
  extractData?: ResponseDataExtractor
  /** 从响应提取错误信息（默认提取 response.data.code/message） */
  extractError?: ResponseErrorExtractor
}

/** 请求拦截器函数类型 */
export type RequestInterceptorFn = (
  config: InternalAxiosRequestConfig
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>

/** 请求拦截器错误处理函数类型 */
export type RequestErrorFn = (error: unknown) => unknown

/** 响应拦截器函数类型 */
export type ResponseInterceptorFn = (
  response: AxiosResponse
) => AxiosResponse | Promise<AxiosResponse>

/** 响应拦截器错误处理函数类型 */
export type ResponseErrorFn = (error: AxiosError) => unknown

/** 拦截器配置 */
export interface InterceptorConfig {
  /** 请求拦截器 (成功) */
  request?: RequestInterceptorFn
  /** 请求拦截器 (失败) */
  requestError?: RequestErrorFn
  /** 响应拦截器 (成功) */
  response?: ResponseInterceptorFn
  /** 响应拦截器 (失败) */
  responseError?: ResponseErrorFn
}

/** 请求错误 */
export class RequestError extends Error {
  constructor(
    message: string,
    public code: number | string,
    public original?: AxiosError
  ) {
    super(message)
    this.name = 'RequestError'
  }
}
