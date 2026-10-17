import { describe, expect, it, vi } from "vitest";
import { attemptLogin } from "../../src/lib/auth/login";
import { sha256Hex } from "../../src/lib/auth/crypto";
import { createMemoryStore, type AuthStore } from "../../src/lib/auth/store";

const env = { ADMIN_EMAIL: "ana@example.com", ADMIN_PASSWORD: "Secreta-123" };
const NOW = 1_800_000_000_000;

function run(
  store: AuthStore,
  email: string,
  password: string,
  opts: { env?: typeof env | object; now?: number; log?: () => void } = {},
) {
  return attemptLogin({
    store,
    env: opts.env ?? env,
    email,
    password,
    now: opts.now ?? NOW,
    log: opts.log ?? (() => {}),
  });
}

describe("attemptLogin", () => {
  it("con credenciales correctas crea una sesión", async () => {
    const store = createMemoryStore();
    const r = await run(store, "ana@example.com", "Secreta-123");
    expect(r.status).toBe("ok");
    if (r.status !== "ok") return;
    expect(store.sessions.size).toBe(1);
    expect(store.sessions.has(await sha256Hex(r.token))).toBe(true);
  });

  it("correo mal y contraseña mal dan el mismo resultado", async () => {
    const store = createMemoryStore();
    const a = await run(store, "otra@example.com", "Secreta-123");
    const b = await run(store, "ana@example.com", "mala");
    expect(a).toEqual({ status: "invalid" });
    expect(b).toEqual(a);
    expect(store.sessions.size).toBe(0);
    expect(store.failures).toHaveLength(2);
  });

  it("campos vacíos no consultan credenciales ni cuentan como fallo", async () => {
    const store = createMemoryStore();
    expect(await run(store, "", "x")).toEqual({ status: "empty" });
    expect(await run(store, "a@x.com", "")).toEqual({ status: "empty" });
    expect(await run(store, "   ", "x")).toEqual({ status: "empty" });
    expect(store.failures).toHaveLength(0);
  });

  it("si el almacén falla no concede acceso", async () => {
    const store = createMemoryStore();
    store.insertSession = async () => {
      throw new Error("D1 caída");
    };
    expect(await run(store, "ana@example.com", "Secreta-123")).toEqual({
      status: "unavailable",
    });
  });

  it("sin secretos rechaza y deja aviso", async () => {
    const store = createMemoryStore();
    const log = vi.fn();
    const r = await run(store, "ana@example.com", "Secreta-123", {
      env: {},
      log,
    });
    expect(r).toEqual({ status: "invalid" });
    expect(log).toHaveBeenCalled();
    expect(store.sessions.size).toBe(0);
  });
});

describe("attemptLogin: bloqueo por fallos", () => {
  const min15 = 15 * 60_000;

  async function fail(store: AuthStore, times: number, now = NOW) {
    for (let i = 0; i < times; i++)
      await run(store, "x@x.com", "mala", { now });
  }

  it("tras 5 fallos rechaza todo, incluso credenciales correctas, sin registrar nada", async () => {
    const store = createMemoryStore();
    await fail(store, 5);
    const bad = await run(store, "x@x.com", "mala");
    const good = await run(store, "ana@example.com", "Secreta-123");
    expect(bad).toEqual({ status: "locked" });
    expect(good).toEqual(bad);
    expect(store.failures).toHaveLength(5);
    expect(store.sessions.size).toBe(0);
  });

  it("recupera el acceso a los 15 minutos", async () => {
    const store = createMemoryStore();
    await fail(store, 5);
    const r = await run(store, "ana@example.com", "Secreta-123", {
      now: NOW + min15,
    });
    expect(r.status).toBe("ok");
  });

  it("un login correcto con 4 fallos previos entra y reinicia el conteo", async () => {
    const store = createMemoryStore();
    await fail(store, 4);
    expect((await run(store, "ana@example.com", "Secreta-123")).status).toBe(
      "ok",
    );
    expect(store.failures).toHaveLength(0);
  });

  it("borra fallos de más de 15 minutos y sesiones vencidas en cada intento", async () => {
    const store = createMemoryStore();
    await fail(store, 2, NOW - min15 - 1);
    await store.insertSession({
      id: "vieja",
      createdAt: 0,
      expiresAt: NOW - 1,
    });
    await run(store, "x@x.com", "mala");
    expect(store.failures).toEqual([NOW]);
    expect(store.sessions.has("vieja")).toBe(false);
  });
});
