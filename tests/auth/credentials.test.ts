import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  verifyCredentials,
} from "../../src/lib/auth/credentials";

const secrets = {
  ADMIN_EMAIL: "Ana@Example.com ",
  ADMIN_PASSWORD: "Secreta-123",
};

describe("credentials", () => {
  it("normaliza el correo", () => {
    expect(normalizeEmail("  ANA@x.com ")).toBe("ana@x.com");
  });

  it("acepta correo con mayúsculas y espacios", async () => {
    expect(
      await verifyCredentials(secrets, "  ana@EXAMPLE.com", "Secreta-123"),
    ).toBe(true);
  });

  it("rechaza correo incorrecto", async () => {
    expect(await verifyCredentials(secrets, "otra@x.com", "Secreta-123")).toBe(
      false,
    );
  });

  it("rechaza contraseña incorrecta y no la normaliza", async () => {
    expect(
      await verifyCredentials(secrets, "ana@example.com", "secreta-123"),
    ).toBe(false);
    expect(
      await verifyCredentials(secrets, "ana@example.com", "Secreta-123 "),
    ).toBe(false);
  });

  it("falla cerrada si falta un secreto", async () => {
    expect(
      await verifyCredentials({ ADMIN_EMAIL: "a@x.com" }, "a@x.com", ""),
    ).toBe(false);
    expect(await verifyCredentials({ ADMIN_PASSWORD: "p" }, "", "p")).toBe(
      false,
    );
    expect(await verifyCredentials({}, "a@x.com", "p")).toBe(false);
  });
});
