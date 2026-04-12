import axios, { type AxiosInstance } from 'axios'
import type { ApiResponse, RequestConfig, ErrorMapper } from './types'
import { cache, RequestCache } from './cache'
import { withRetry } from './retry'
import { concurrency } from './concurrency'
import { cancelManager } from './cancel'
import {
  setupRequestInterceptor,
  setupResponseInterceptor,
} from './interceptors'

/** HttpClient 配置选项 */
export interface HttpClientOptions {
  /** 基础 URL */
  baseURL?: string
  /** 默认超时 (ms) */
  timeout?: number
  /** 错误码映射 */
  errorMap?: ErrorMapper
  /** 最大并发数 */
  maxConcurrent?: number
}

/** 默认配置 */
const DEFAULT_OPTIONS: Required<HttpClientOptions> = {
  baseURL: '',
  timeout: 10_000,
  errorMap: {},
  maxConcurrent: 6,
}

/** HTTP 客户端类 */
export class HttpClient {
  private instance: AxiosInstance
  private options: Required<HttpClientOptions>

  constructor(options: HttpClientOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.instance = axios.create({
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
      headers: { 'Content-Type': 'application/json' },
    })

    this.setupInterceptors()
    this.setConcurrency(this.options.maxConcurrent)
  }

  /** 设置拦截器 */
  private setupInterceptors(): void {
    setupRequestInterceptor(this.instance)
    setupResponseInterceptor(this.instance, this.options.errorMap)
  }

  /** 设置并发数 */
  setConcurrency(limit: number): void {
    concurrency.setLimit(limit)
  }

  /** 清除缓存 */
  clearCache(pattern?: string): void {
    cache.clear(pattern)
  }

  /** 取消请求 */
  cancelRequest(key: string): void {
    cancelManager.cancel(key)
  }

  /** 取消所有请求 */
  cancelAll(): void {
    cancelManager.cancelAll()
  }

  /** 通用请求方法 */
  async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    const cacheKey = config.cache
      ? RequestCache.key(
          config.method || 'get',
          config.url || '',
          config.params,
          config.data
        )
      : null

    // 读取缓存
    if (cacheKey && config.cache) {
      const cached = cache.get<ApiResponse<T>>(cacheKey)
      if (cached) return cached
    }

    // 执行请求
    const execute = async (): Promise<ApiResponse<T>> => {
      const signal =
        config.method?.toLowerCase() === 'get' && config.cache
          ? cancelManager.createSignal(cacheKey || '')
          : undefined

      try {
        const response = await this.instance.request<ApiResponse<T>>({
          ...config,
          signal,
        })

        // 写入缓存
        if (cacheKey) {
          const ttl =
            typeof config.cache === 'number' ? config.cache : 5 * 60 * 1000
          cache.set(cacheKey, response.data, ttl)
        }

        return response.data
      } finally {
        if (cacheKey) {
          cancelManager.cleanup(cacheKey)
        }
      }
    }

    // 并发控制 + 重试
    const retries = config.retry ?? 0
    const retryDelay = config.retryDelay ?? 1000

    return concurrency.execute(() => withRetry(execute, retries, retryDelay))
  }

  /** GET 请求 */
  async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      ...config,
    })
  }

  /** POST 请求 */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    })
  }

  /** PUT 请求 */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    })
  }

  /** DELETE 请求 */
  async delete<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    })
  }
}

/** 默认实例 */
export const http = new HttpClient()
