import { describe, expect, it } from "vitest";
import {
  generateToken,
  sha256Bytes,
  sha256Hex,
  timingSafeEqualBytes,
} from "../../src/lib/auth/crypto";

describe("crypto", () => {
  it("calcula SHA-256 en hexadecimal", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("genera tokens base64url de 43 caracteres y distintos", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it("compara resúmenes iguales y distintos", async () => {
    const x = await sha256Bytes("uno");
    expect(timingSafeEqualBytes(x, await sha256Bytes("uno"))).toBe(true);
    expect(timingSafeEqualBytes(x, await sha256Bytes("dos"))).toBe(false);
    expect(timingSafeEqualBytes(x, new Uint8Array(3))).toBe(false);
  });
});
