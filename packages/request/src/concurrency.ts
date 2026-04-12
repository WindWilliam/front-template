/** 并发控制器 */
export class ConcurrencyController {
  private running = 0
  private queue: Array<() => void> = []

  constructor(private maxConcurrent: number) {}

  /** 执行受控请求 */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve))
    }

    this.running++
    try {
      return await fn()
    } finally {
      this.running--
      this.next()
    }
  }

  /** 设置最大并发数 */
  setLimit(limit: number): void {
    this.maxConcurrent = limit
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      this.next()
    }
  }

  private next(): void {
    const next = this.queue.shift()
    if (next) next()
  }
}

export const concurrency = new ConcurrencyController(6)
