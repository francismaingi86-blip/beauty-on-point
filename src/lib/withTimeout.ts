/** Rejects after `ms` if `promise` hasn't settled — prevents a stuck request from hanging forever silently. */
export function withTimeout<T>(promise: Promise<T>, ms: number, message = 'The server is taking too long to respond. Please try again.'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}
