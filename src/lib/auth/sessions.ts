import { generateToken, sha256Hex } from "./crypto";
import type { AuthStore } from "./store";

/** 30 días, fijos desde el inicio de sesión y sin renovación (FR-007). */
export const SESSION_TTL_MS = 2_592_000_000;

/** Crea una sesión; en el almacén queda solo el hash del token (FR-013). */
export async function createSession(
  store: AuthStore,
  now: number,
): Promise<{ token: string; expiresAt: number }> {
  const token = generateToken();
  const expiresAt = now + SESSION_TTL_MS;
  await store.insertSession({
    id: await sha256Hex(token),
    createdAt: now,
    expiresAt,
  });
  return { token, expiresAt };
}

/** Sesión válida: la fila existe y `expiresAt > now`. Cualquier error cuenta como inválida. */
export async function validateSession(
  store: AuthStore,
  token: string | undefined,
  now: number,
): Promise<{ id: string } | null> {
  if (!token) return null;
  try {
    const id = await sha256Hex(token);
    const row = await store.findSession(id);
    return row && row.expiresAt > now ? { id } : null;
  } catch {
    return null;
  }
}

export async function deleteSession(
  store: AuthStore,
  token: string,
): Promise<void> {
  await store.deleteSession(await sha256Hex(token));
}

export async function cleanupExpired(
  store: AuthStore,
  now: number,
): Promise<void> {
  await store.deleteExpiredSessions(now);
}
