export async function pcall<T>(fn: () => T | void): Promise<[true, Awaited<T>] | [Error, undefined]> {
  try {
    const value = await fn();
    return [ true, value as Awaited<T> ]
  } catch (error) {
    return [ error as Error, undefined ];
  }
}
export function pcall_sync<T>(fn: () => T | void): [true, T] | [Error, undefined] {
  try {
    const value = fn();
    return [ true, value as T ];
  } catch (error) {
    return [ error as Error, undefined ];
  }
}