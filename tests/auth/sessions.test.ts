import { describe, expect, it } from "vitest";
import { sha256Hex } from "../../src/lib/auth/crypto";
import {
  cleanupExpired,
  createSession,
  deleteSession,
  SESSION_TTL_MS,
  validateSession,
} from "../../src/lib/auth/sessions";
import { createMemoryStore } from "../../src/lib/auth/store";

const NOW = 1_800_000_000_000;

describe("sesiones", () => {
  it("vence a los 30 días exactos, sin renovación", async () => {
    const store = createMemoryStore();
    const { token } = await createSession(store, NOW);
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(
      await validateSession(store, token, NOW + SESSION_TTL_MS - 1),
    ).not.toBeNull();
    expect(
      await validateSession(store, token, NOW + SESSION_TTL_MS),
    ).toBeNull();
    // validar no extiende el vencimiento
    expect([...store.sessions.values()][0].expiresAt).toBe(
      NOW + SESSION_TTL_MS,
    );
  });

  it("guarda solo el hash de 64 caracteres, nunca el token", async () => {
    const store = createMemoryStore();
    const { token } = await createSession(store, NOW);
    const [id] = [...store.sessions.keys()];
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toBe(token);
    expect(id).toBe(await sha256Hex(token));
  });

  it("cada inicio de sesión es independiente", async () => {
    const store = createMemoryStore();
    const a = await createSession(store, NOW);
    const b = await createSession(store, NOW);
    expect(store.sessions.size).toBe(2);
    await deleteSession(store, a.token);
    expect(await validateSession(store, a.token, NOW)).toBeNull();
    expect(await validateSession(store, b.token, NOW)).not.toBeNull();
  });

  it("una copia del token no sirve tras cerrar la sesión", async () => {
    const store = createMemoryStore();
    const { token } = await createSession(store, NOW);
    const copia = `${token}`;
    await deleteSession(store, token);
    expect(await validateSession(store, copia, NOW)).toBeNull();
  });

  it("sin cookie o con error del almacén la sesión no es válida", async () => {
    const store = createMemoryStore();
    expect(await validateSession(store, undefined, NOW)).toBeNull();
    store.findSession = async () => {
      throw new Error("D1 caída");
    };
    expect(await validateSession(store, "x", NOW)).toBeNull();
  });

  it("la limpieza borra vencidas y conserva vigentes", async () => {
    const store = createMemoryStore();
    const old = await createSession(store, NOW);
    const fresh = await createSession(store, NOW + SESSION_TTL_MS);
    await cleanupExpired(store, NOW + SESSION_TTL_MS + 1);
    expect(store.sessions.size).toBe(1);
    expect(await validateSession(store, old.token, NOW)).toBeNull();
    expect(
      await validateSession(store, fresh.token, NOW + SESSION_TTL_MS + 1),
    ).not.toBeNull();
  });
});
