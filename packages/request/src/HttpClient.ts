import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type {
  RequestConfig,
  ErrorMapper,
  InterceptorConfig,
  ResponseConfig,
} from './types'
import { RequestError } from './types'
import { cache, RequestCache } from './cache'
import { withRetry } from './retry'
import { concurrency } from './concurrency'
import { cancelManager } from './cancel'
import {
  registerInterceptors,
  setupDefaultResponseInterceptor,
  setupResponseInterceptor,
  setupDataExtractorInterceptor,
} from './interceptors'

/** HttpClient 配置选项 */
export interface HttpClientOptions {
  /** 基础 URL */
  baseURL?: string
  /** 默认超时 (ms) */
  timeout?: number
  /** HTTP 状态码错误映射 */
  errorMap?: ErrorMapper
  /** 业务错误码映射 */
  businessErrorMap?: ErrorMapper
  /** 最大并发数 */
  maxConcurrent?: number
  /** 响应处理配置（成功码、数据提取、错误提取） */
  response?: ResponseConfig
  /** 自定义拦截器配置 */
  interceptors?: InterceptorConfig
}

/** 默认配置 */
const DEFAULT_OPTIONS: Required<
  Omit<HttpClientOptions, 'interceptors' | 'businessErrorMap' | 'response'>
> & {
  interceptors?: InterceptorConfig
  businessErrorMap?: ErrorMapper
  response?: ResponseConfig
} = {
  baseURL: '',
  timeout: 10_000,
  errorMap: {},
  businessErrorMap: {},
  maxConcurrent: 6,
  response: undefined,
  interceptors: undefined,
}

/** HTTP 客户端类 */
export class HttpClient {
  private instance: AxiosInstance
  private options: Required<
    Omit<HttpClientOptions, 'interceptors' | 'businessErrorMap' | 'response'>
  > & {
    interceptors?: InterceptorConfig
    businessErrorMap?: ErrorMapper
    response?: ResponseConfig
  }

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
    // 1. 先注册自定义请求拦截器（如果有）
    if (this.options.interceptors?.request) {
      registerInterceptors(this.instance, {
        request: this.options.interceptors.request,
        requestError: this.options.interceptors.requestError,
      })
    }

    // 2. 默认响应拦截器：HTTP 错误处理
    setupDefaultResponseInterceptor(this.instance, this.options.errorMap)

    // 3. 业务响应拦截器（如果配置了 response 或 businessErrorMap）
    if (this.options.response || this.options.businessErrorMap) {
      setupResponseInterceptor(
        this.instance,
        this.options.response ?? {},
        this.options.businessErrorMap
      )
    }

    // 4. 数据提取拦截器（如果配置了 extractData）
    if (this.options.response?.extractData) {
      setupDataExtractorInterceptor(
        this.instance,
        this.options.response.extractData
      )
    }

    // 5. 自定义响应拦截器（如果有）
    if (this.options.interceptors?.response) {
      registerInterceptors(this.instance, {
        response: this.options.interceptors.response,
        responseError: this.options.interceptors.responseError,
      })
    }
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
  async request<T = unknown>(config: RequestConfig): Promise<T> {
    const cacheKey = config.cache
      ? RequestCache.key(
          config.method || 'get',
          config.url || '',
          config.params,
          config.data
        )
      : null

    // 读取缓存
    if (cacheKey && config.cache && !config.rawResponse) {
      const cached = cache.get<T>(cacheKey)
      if (cached) return cached
    }

    // 执行请求
    const execute = async (): Promise<T> => {
      const signal =
        config.method?.toLowerCase() === 'get' && config.cache
          ? cancelManager.createSignal(cacheKey || '')
          : undefined

      try {
        const response = await this.instance.request<T>({
          ...config,
          signal,
        })

        // 写入缓存（非 rawResponse）
        if (cacheKey && !config.rawResponse) {
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

  /** 原始请求（返回 AxiosResponse，跳过所有拦截） */
  async rawRequest<T = unknown>(
    config: RequestConfig
  ): Promise<AxiosResponse<T>> {
    // 设置 rawResponse 标记，拦截器会检查
    const requestConfig = {
      ...config,
      rawResponse: true,
    }
    const response = await this.instance.request<T>(
      requestConfig as RequestConfig
    )
    return response
  }

  /** 文件下载（GET/POST） */
  async download(
    url: string,
    data?: Record<string, unknown>,
    config?: RequestConfig & { method?: 'GET' | 'POST' }
  ): Promise<Blob> {
    const method = config?.method ?? 'GET'
    const response = await this.rawRequest<Blob>({
      url,
      method,
      [method === 'GET' ? 'params' : 'data']: data,
      responseType: 'blob',
      ...config,
      rawResponse: true,
    })

    const blob = response.data

    // 后台返回 JSON 错误（而非 blob）
    if (blob.type === 'application/json') {
      const text = await blob.text()
      const errorData = JSON.parse(text)
      throw new RequestError(
        errorData.message || '下载失败',
        errorData.code || -1
      )
    }

    return blob
  }

  /** 文件上传 */
  async upload<T = unknown>(
    url: string,
    file: File | FormData,
    config?: RequestConfig
  ): Promise<T> {
    const data = file instanceof FormData ? file : new FormData()
    if (file instanceof File) {
      data.append('file', file)
    }

    return this.request<T>({
      url,
      method: 'POST',
      data,
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    })
  }

  /** GET 请求 */
  async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<T> {
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
  ): Promise<T> {
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
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    })
  }

  /** DELETE 请求 */
  async delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    })
  }
}

/** 默认实例（仅 HTTP 错误处理，无请求拦截） */
export const http = new HttpClient()
