import { describe, expect, it } from "vitest";
import { guardRequest } from "../../src/lib/auth/guard";
import { createSession } from "../../src/lib/auth/sessions";
import { createMemoryStore, type AuthStore } from "../../src/lib/auth/store";

const SITE = "https://samuele.example";
const NOW = 1_800_000_000_000;

function req(
  path: string,
  init: { method?: string; origin?: string; token?: string } = {},
) {
  const headers: Record<string, string> = {};
  if (init.origin) headers.Origin = init.origin;
  if (init.token) headers.Cookie = `__Host-session=${init.token}`;
  return new Request(`${SITE}${path}`, {
    method: init.method ?? "GET",
    headers,
  });
}

async function run(store: AuthStore, request: Request, now = NOW) {
  return guardRequest({ request, store, now, prod: true });
}

describe("guardRequest", () => {
  it("deja pasar el sitio público sin cabeceras", async () => {
    const r = await run(createMemoryStore(), req("/"));
    expect(r).toEqual({ action: "pass", noStore: false });
    expect(await run(createMemoryStore(), req("/no-existe"))).toEqual(r);
  });

  it("rechaza POST sin Origin o con Origin ajeno (403), incluido /admin/login", async () => {
    const store = createMemoryStore();
    for (const path of ["/admin/login", "/api/admin/logout"]) {
      for (const origin of [undefined, "https://malo.example"]) {
        const r = await run(store, req(path, { method: "POST", origin }));
        expect(r.action).toBe("respond");
        if (r.action === "respond") {
          expect(r.response.status).toBe(403);
          expect(r.response.headers.get("Cache-Control")).toBe("no-store");
        }
      }
    }
  });

  it("deja pasar /admin/login sin sesión y POST con Origin propio", async () => {
    const store = createMemoryStore();
    expect((await run(store, req("/admin/login"))).action).toBe("pass");
    expect(
      (await run(store, req("/admin/login", { method: "POST", origin: SITE })))
        .action,
    ).toBe("pass");
  });

  it("redirige GET /admin/login con sesión válida a /admin", async () => {
    const store = createMemoryStore();
    const { token } = await createSession(store, NOW);
    const r = await run(store, req("/admin/login", { token }));
    expect(r.action).toBe("respond");
    if (r.action === "respond") {
      expect(r.response.status).toBe(303);
      expect(r.response.headers.get("Location")).toBe("/admin");
    }
  });

  it("redirige las páginas del panel sin sesión, incluso rutas inexistentes", async () => {
    const store = createMemoryStore();
    for (const path of [
      "/admin",
      "/admin/",
      "/admin/cualquier-cosa",
      "/admin/a/b",
    ]) {
      const r = await run(store, req(path));
      expect(r.action).toBe("respond");
      if (r.action === "respond") {
        expect(r.response.status).toBe(303);
        expect(r.response.headers.get("Location")).toBe("/admin/login");
      }
    }
  });

  it("responde 401 JSON en /api/admin sin sesión", async () => {
    const r = await run(createMemoryStore(), req("/api/admin/x"));
    expect(r.action).toBe("respond");
    if (r.action === "respond") {
      expect(r.response.status).toBe(401);
      expect(await r.response.json()).toEqual({ error: "unauthorized" });
    }
  });

  it("con sesión válida pasa con la sesión y no-store", async () => {
    const store = createMemoryStore();
    const { token } = await createSession(store, NOW);
    for (const path of ["/admin", "/admin/otra", "/api/admin/x"]) {
      const r = await run(store, req(path, { token }));
      expect(r.action).toBe("pass");
      if (r.action === "pass") {
        expect(r.session).toBeDefined();
        expect(r.noStore).toBe(true);
      }
    }
  });

  it("trata como sin sesión: vencida, hash inexistente y error del almacén", async () => {
    const store = createMemoryStore();
    const { token } = await createSession(store, NOW);
    const later = NOW + 2_592_000_000;
    for (const [s, t, now] of [
      [store, token, later],
      [store, "token-inventado", NOW],
      [
        Object.assign(createMemoryStore(), {
          findSession: async () => {
            throw new Error("D1 caída");
          },
        }),
        token,
        NOW,
      ],
    ] as const) {
      const r = await run(s, req("/admin", { token: t }), now);
      expect(r.action).toBe("respond");
      if (r.action === "respond") expect(r.response.status).toBe(303);
    }
  });
});
