import { verifyCredentials, type AdminSecrets } from "./credentials";
import { cleanupExpired, createSession } from "./sessions";
import type { AuthStore } from "./store";
import { isLocked, MAX_FAILURES, WINDOW_MS } from "./throttle";

export type LoginResult =
  | { status: "ok"; token: string; expiresAt: number }
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "locked" }
  | { status: "unavailable" };

export interface LoginInput {
  store: AuthStore;
  env: AdminSecrets;
  email: string;
  password: string;
  now: number;
  log: (message: string) => void;
}

/** Caso de uso: valida la entrada, aplica el bloqueo, comprueba la credencial y crea la sesión. */
export async function attemptLogin(input: LoginInput): Promise<LoginResult> {
  const { store, env, email, password, now, log } = input;

  if (email.trim() === "" || password === "") return { status: "empty" };

  try {
    // Limpieza al consultar (FR-018): fallos fuera de la ventana y sesiones vencidas
    await store.batch([
      () => store.deleteFailuresBefore(now - WINDOW_MS),
      () => cleanupExpired(store, now),
    ]);
    if (isLocked(await store.recentFailures(MAX_FAILURES), now)) {
      return { status: "locked" };
    }
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      log(
        "Faltan ADMIN_EMAIL o ADMIN_PASSWORD: el inicio de sesión rechaza todo.",
      );
    }
    if (!(await verifyCredentials(env, email, password))) {
      await store.insertFailure(now);
      return { status: "invalid" };
    }
    await store.deleteAllFailures(); // FR-011
    const { token, expiresAt } = await createSession(store, now);
    return { status: "ok", token, expiresAt };
  } catch {
    return { status: "unavailable" };
  }
}
