import { describe, expect, it } from "vitest";
import { expiredCookie, sessionCookie } from "../../src/lib/auth/cookie";
import { guardRequest } from "../../src/lib/auth/guard";
import { createSession, deleteSession } from "../../src/lib/auth/sessions";
import { createMemoryStore } from "../../src/lib/auth/store";

const SITE = "https://samuele.example";
const NOW = 1_800_000_000_000;

describe("cierre de sesión", () => {
  it("la cookie de cierre expira de inmediato con los mismos atributos", () => {
    const c = expiredCookie(true);
    expect(c).toContain("__Host-session=;");
    expect(c).toContain("Max-Age=0");
    expect(c).toContain("HttpOnly");
    expect(c).toContain("Secure");
  });

  it("la cookie de sesión es HttpOnly, Secure, Lax y dura 30 días", () => {
    const c = sessionCookie("abc", true);
    expect(c).toBe(
      "__Host-session=abc; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000",
    );
    expect(sessionCookie("abc", false)).not.toContain("Secure");
  });

  it("tras borrar la sesión el token deja de servir en el middleware", async () => {
    const store = createMemoryStore();
    const { token } = await createSession(store, NOW);
    const post = () =>
      new Request(`${SITE}/api/admin/logout`, {
        method: "POST",
        headers: { Origin: SITE, Cookie: `__Host-session=${token}` },
      });
    expect(
      (await guardRequest({ request: post(), store, now: NOW, prod: true }))
        .action,
    ).toBe("pass");
    await deleteSession(store, token);
    const r = await guardRequest({
      request: post(),
      store,
      now: NOW,
      prod: true,
    });
    expect(r.action).toBe("respond");
    if (r.action === "respond") expect(r.response.status).toBe(401);
  });
});
