/**
 * Generic debounce — delays invocation until `ms` milliseconds
 * of silence have passed since the last call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  return debounced as unknown as T;
}

/**
 * Generic throttle — invokes `fn` at most once per `ms` milliseconds.
 * Uses a trailing-edge call to ensure the last invocation is not lost.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): T {
  let lastRun = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = ms - (now - lastRun);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastRun = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  };
  return throttled as unknown as T;
}

/**
 * Simple memoization with a Map cache keyed on the first argument
 * (JSON-serialized for objects).
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T
): T {
  const cache = new Map<string, ReturnType<T>>();
  const memoized = (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  };
  return memoized as unknown as T;
}
