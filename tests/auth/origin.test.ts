import { describe, expect, it } from "vitest";
import { isSafeMethod, isSameOrigin } from "../../src/lib/auth/origin";

const SITE = "https://samuele.example";

function post(origin?: string) {
  return new Request(`${SITE}/api/admin/logout`, {
    method: "POST",
    headers: origin ? { Origin: origin } : {},
  });
}

describe("origin", () => {
  it("los métodos de lectura son seguros", () => {
    for (const m of ["GET", "HEAD", "OPTIONS", "get"]) {
      expect(isSafeMethod(m)).toBe(true);
    }
    for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(isSafeMethod(m)).toBe(false);
    }
  });

  it("rechaza POST sin Origin", () => {
    expect(isSameOrigin(post(), SITE)).toBe(false);
  });

  it("rechaza POST con Origin ajeno", () => {
    expect(isSameOrigin(post("https://malo.example"), SITE)).toBe(false);
  });

  it("acepta POST con Origin propio", () => {
    expect(isSameOrigin(post(SITE), SITE)).toBe(true);
  });
});
