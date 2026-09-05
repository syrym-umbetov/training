// docs: fetching-data#streaming
// Искусственная задержка, чтобы границы стриминга и скелетоны были видны.
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
