/**
 * Pauses execution for a specified number of milliseconds using setTimeout.
 * @param ms The number of milliseconds to sleep.
 * @returns A Promise that resolves after the specified duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
