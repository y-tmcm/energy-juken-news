/**
 * 503 (UNAVAILABLE) / 429 (RESOURCE_EXHAUSTED) など一時的な Gemini API エラーを
 * 指数バックオフ + jitter で自動リトライする。
 *
 * デフォルト設定（Google Cloud 公式推奨に準拠）:
 *   - 最大5回試行（リトライ4回）
 *   - 待ち時間: 2s → 4s → 8s → 16s → 32s（上限60s）
 *   - ±25% jitter でリトライ集中（thundering herd）を防止
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    label?: string;
  } = {},
): Promise<T> {
  const {
    maxAttempts = 5,
    initialDelayMs = 2_000,
    maxDelayMs = 60_000,
    label = "API call",
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || attempt === maxAttempts) throw error;
      const base = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      const jitter = base * 0.25 * (Math.random() * 2 - 1);
      const delayMs = Math.round(base + jitter);
      console.warn(
        `[Retry] ${label}: ${attempt}/${maxAttempts} 回目失敗、${(delayMs / 1000).toFixed(1)}秒後に再試行...`,
      );
      await sleep(delayMs);
    }
  }
  throw new Error("unreachable");
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    msg.includes('"code":503') ||
    msg.includes('"code":429') ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
