import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
} from 'axios'
import type {
  RequestConfig,
  ErrorMapper,
  InterceptorConfig,
  ResponseConfig,
  SuccessCodeConfig,
} from './types'
import { RequestError } from './types'

/**
 * 注册自定义拦截器
 * @param instance axios 实例
 * @param interceptors 拦截器配置
 */
export function registerInterceptors(
  instance: AxiosInstance,
  interceptors?: InterceptorConfig
): void {
  // 注册请求拦截器
  if (interceptors?.request || interceptors?.requestError) {
    instance.interceptors.request.use(
      interceptors.request ?? ((config) => config),
      interceptors.requestError ?? ((error) => Promise.reject(error))
    )
  }

  // 注册响应拦截器
  if (interceptors?.response || interceptors?.responseError) {
    instance.interceptors.response.use(
      interceptors.response ?? ((response) => response),
      interceptors.responseError ?? ((error) => Promise.reject(error))
    )
  }
}

/**
 * 设置默认响应拦截器（仅 HTTP 错误处理）
 * - HTTP 状态码错误映射
 * - 超时处理
 * - 取消请求处理
 * @param instance axios 实例
 * @param errorMap HTTP 错误码映射表
 */
export function setupDefaultResponseInterceptor(
  instance: AxiosInstance,
  errorMap: ErrorMapper = {}
): void {
  instance.interceptors.response.use(
    // 成功响应：直接返回，不做处理
    (response: AxiosResponse) => response,
    // 错误响应：统一处理
    (error: AxiosError) => {
      const config = error.config as RequestConfig
      if (config?.skipErrorHandler) {
        return Promise.reject(error)
      }

      // HTTP 状态码错误
      if (error.response) {
        const status = error.response.status
        const message =
          errorMap[status] || error.response.statusText || '网络异常'
        handleError(status, message)
        return Promise.reject(new RequestError(message, status, error))
      }

      // 超时
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new RequestError('请求超时', 408, error))
      }

      // 取消请求
      if (axios.isCancel(error)) {
        return Promise.reject(new RequestError('请求已取消', 499, error))
      }

      // 其他网络错误
      return Promise.reject(new RequestError('网络异常', -1, error))
    }
  )
}

/**
 * 判断响应是否成功
 */
function isSuccessResponse(
  response: AxiosResponse,
  successCodes?: SuccessCodeConfig
): boolean {
  if (!successCodes) {
    // 默认：检查 response.data.code 是否为 0 或 200
    const code = response.data?.code
    return code === 0 || code === 200
  }

  if (typeof successCodes === 'function') {
    return successCodes(response)
  }

  // 数组形式
  const code = response.data?.code
  return successCodes.includes(code)
}

/**
 * 默认错误提取：从 response.data 提取 code 和 message
 */
const defaultExtractError = (response: AxiosResponse) => {
  const { code, message } = response.data ?? {}
  if (code && !isSuccessResponse(response)) {
    return { code, message: message || '请求失败' }
  }
  return null
}

/**
 * 设置业务响应拦截器
 * - 自定义成功码判断
 * - 自定义数据提取
 * - 自定义错误提取
 * - 支持单请求级配置优先
 * @param instance axios 实例
 * @param config 响应处理配置（全局）
 * @param errorMap 业务错误码映射表（可选）
 */
export function setupResponseInterceptor(
  instance: AxiosInstance,
  config: ResponseConfig = {},
  errorMap: ErrorMapper = {}
): void {
  const { successCodes, extractError = defaultExtractError } = config

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const requestConfig = response.config as RequestConfig

      // 跳过业务错误处理（rawResponse 或 skipBusinessError）
      if (requestConfig?.rawResponse || requestConfig?.skipBusinessError) {
        return response
      }

      // 单请求级配置优先
      const requestSuccessCodes =
        requestConfig?.response?.successCodes ?? successCodes
      const requestExtractError =
        requestConfig?.response?.extractError ?? extractError

      // 判断是否成功
      if (!isSuccessResponse(response, requestSuccessCodes)) {
        const errorInfo = requestExtractError(response)
        if (errorInfo) {
          const mappedMessage =
            errorMap[errorInfo.code as number] ||
            errorInfo.message ||
            '请求失败'
          if (!requestConfig?.skipErrorHandler) {
            handleError(errorInfo.code as number, mappedMessage)
          }
          return Promise.reject(
            new RequestError(mappedMessage, errorInfo.code as number)
          )
        }
      }

      return response
    },
    (error) => Promise.reject(error)
  )
}

/**
 * 创建数据提取拦截器
 * - 将响应数据转换为最终格式
 * - 支持单请求级配置优先
 * @param instance axios 实例
 * @param extractData 数据提取函数（全局）
 */
export function setupDataExtractorInterceptor<T = unknown>(
  instance: AxiosInstance,
  extractData: (response: AxiosResponse) => T
): void {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const requestConfig = response.config as RequestConfig

      // 跳过数据提取（rawResponse）
      if (requestConfig?.rawResponse) {
        return response
      }

      // 单请求级配置优先
      const requestExtractData = requestConfig?.response?.extractData
      if (requestExtractData) {
        response.data = requestExtractData(response)
      } else {
        response.data = extractData(response)
      }

      return response
    },
    (error) => Promise.reject(error)
  )
}

/** 统一错误处理 */
function handleError(code: number | string, message: string): void {
  console.error(`[Request Error] ${code}: ${message}`)
}
