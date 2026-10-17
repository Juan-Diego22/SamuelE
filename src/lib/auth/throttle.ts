export const WINDOW_MS = 15 * 60_000;
export const MAX_FAILURES = 5;

/**
 * Bloqueo global (data-model.md): con t1 ≥ … ≥ t5 los 5 fallos más recientes, hay bloqueo
 * si existen los 5, `now − t1 < 15 min` y `t1 − t5 ≤ 15 min`. Se levanta solo con el tiempo.
 */
export function isLocked(failures: number[], now: number): boolean {
  const latest = [...failures].sort((a, b) => b - a).slice(0, MAX_FAILURES);
  if (latest.length < MAX_FAILURES) return false;
  const t1 = latest[0];
  const t5 = latest[MAX_FAILURES - 1];
  return now - t1 < WINDOW_MS && t1 - t5 <= WINDOW_MS;
}
