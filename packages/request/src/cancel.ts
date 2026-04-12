import axios from 'axios'

/** 请求取消管理器 */
export class CancelManager {
  private controllers = new Map<string, AbortController>()

  /** 创建可取消的请求信号 */
  createSignal(key: string): AbortSignal {
    this.cancel(key)

    const controller = new AbortController()
    this.controllers.set(key, controller)
    return controller.signal
  }

  /** 取消指定请求 */
  cancel(key: string): void {
    const controller = this.controllers.get(key)
    if (controller) {
      controller.abort()
      this.controllers.delete(key)
    }
  }

  /** 取消所有请求 */
  cancelAll(): void {
    for (const controller of this.controllers.values()) {
      controller.abort()
    }
    this.controllers.clear()
  }

  /** 清理已完成的请求信号 */
  cleanup(key: string): void {
    this.controllers.delete(key)
  }
}

export const cancelManager = new CancelManager()

/** 创建 axios 取消 token (兼容旧版) */
export function createCancelToken() {
  return axios.CancelToken.source()
}
