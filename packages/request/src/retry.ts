/** 重试机制 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  let lastError: Error

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (i < retries) {
        await sleep(delay * (i + 1))
      }
    }
  }

  throw lastError!
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
