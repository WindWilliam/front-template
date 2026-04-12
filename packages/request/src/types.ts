import type { AxiosError, AxiosRequestConfig } from 'axios'

/** 标准 API 响应格式 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

/** 请求配置扩展 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否启用缓存 */
  cache?: boolean | number
  /** 重试次数 */
  retry?: number
  /** 重试延迟 (ms) */
  retryDelay?: number
  /** 是否跳过全局错误处理 */
  skipErrorHandler?: boolean
  /** 自定义超时 (ms) */
  timeout?: number
}

/** 缓存条目 */
export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
}

/** 错误码映射 */
export type ErrorMapper = Record<number, string>

/** 默认错误码 */
export const DEFAULT_ERROR_MAP: ErrorMapper = {
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

/** 请求错误 */
export class RequestError extends Error {
  constructor(
    message: string,
    public code: number,
    public original?: AxiosError
  ) {
    super(message)
    this.name = 'RequestError'
  }
}
