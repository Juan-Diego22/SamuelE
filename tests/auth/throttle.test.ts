import { describe, expect, it } from "vitest";
import { isLocked, MAX_FAILURES, WINDOW_MS } from "../../src/lib/auth/throttle";

const NOW = 1_800_000_000_000;
const min = (n: number) => n * 60_000;

describe("isLocked", () => {
  it("constantes de la regla", () => {
    expect(MAX_FAILURES).toBe(5);
    expect(WINDOW_MS).toBe(min(15));
  });

  it("sin fallos o con 4 no bloquea", () => {
    expect(isLocked([], NOW)).toBe(false);
    expect(isLocked([NOW, NOW, NOW, NOW], NOW)).toBe(false);
  });

  it("el quinto fallo bloquea", () => {
    expect(isLocked([NOW, NOW - 1, NOW - 2, NOW - 3, NOW - 4], NOW)).toBe(true);
  });

  it("sigue bloqueado a 14 min 59 s y se levanta a los 15 min", () => {
    const fails = [NOW, NOW, NOW, NOW, NOW];
    expect(isLocked(fails, NOW + min(15) - 1000)).toBe(true);
    expect(isLocked(fails, NOW + min(15))).toBe(false);
  });

  it("5 fallos repartidos en más de 15 minutos no bloquean", () => {
    const fails = [
      NOW,
      NOW - min(5),
      NOW - min(10),
      NOW - min(15) - 1,
      NOW - min(16),
    ];
    expect(isLocked(fails, NOW)).toBe(false);
  });

  it("acepta fallos desordenados", () => {
    expect(isLocked([NOW - 4, NOW, NOW - 2, NOW - 1, NOW - 3], NOW)).toBe(true);
  });
});
