import type { CacheEntry } from './types'

/** 请求缓存管理器 */
export class RequestCache {
  private store = new Map<string, CacheEntry>()

  /** 生成缓存 key */
  static key(
    method: string,
    url: string,
    params?: unknown,
    data?: unknown
  ): string {
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
  }

  /** 获取缓存 */
  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  /** 设置缓存 */
  set(key: string, data: unknown, ttl: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /** 清除缓存 */
  clear(pattern?: string): void {
    if (!pattern) {
      this.store.clear()
      return
    }

    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key)
      }
    }
  }

  /** 获取缓存大小 */
  get size(): number {
    return this.store.size
  }
}

export const cache = new RequestCache()
