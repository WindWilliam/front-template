import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import type { RequestConfig, ErrorMapper } from './types'
import { RequestError } from './types'

/** 创建请求拦截器 */
export function setupRequestInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Token 注入
      const token = getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // 时间戳注入（防缓存）
      if (config.method?.toLowerCase() === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now(),
        }
      }

      return config
    },
    (error) => Promise.reject(error)
  )
}

/** 创建响应拦截器 */
export function setupResponseInterceptor(
  instance: AxiosInstance,
  errorMap: ErrorMapper = {}
): void {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const { code, message } = response.data

      // 业务错误码处理
      if (code && code !== 0 && code !== 200) {
        const mappedMessage = errorMap[code] || message || '请求失败'
        if (!(response.config as RequestConfig).skipErrorHandler) {
          handleError(code, mappedMessage)
        }
        return Promise.reject(new RequestError(mappedMessage, code))
      }

      return response
    },
    (error) => {
      const config = error.config as RequestConfig
      if (config?.skipErrorHandler) {
        return Promise.reject(error)
      }

      const { response } = error
      if (response) {
        const status = response.status
        const mappedMessage =
          errorMap[status] || response.statusText || '网络异常'
        handleError(status, mappedMessage)
        return Promise.reject(new RequestError(mappedMessage, status, error))
      }

      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new RequestError('请求超时', 408, error))
      }

      if (axios.isCancel(error)) {
        return Promise.reject(new RequestError('请求已取消', 499, error))
      }

      return Promise.reject(new RequestError('网络异常', -1, error))
    }
  )
}

/** 获取 token */
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

/** 统一错误处理 */
function handleError(code: number, message: string): void {
  // 可扩展：接入 Toast/Notification 等 UI 组件
  console.error(`[Request Error] ${code}: ${message}`)
}
