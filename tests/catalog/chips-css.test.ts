import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// El layout real se comprueba en el celular; aquí se protege el espacio que separa
// la barra de desplazamiento de las categorías de los botones.
const css = readFileSync("src/styles/global.css", "utf8");

describe("fila de categorías", () => {
  it("deja espacio debajo de los botones para la barra de desplazamiento", () => {
    const rule = css.match(/\.chips\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(rule).toMatch(/overflow-x:\s*auto/);
    const padding = rule
      .match(/padding:\s*([^;]+);/)?.[1]
      .trim()
      .split(/\s+/);
    // padding: arriba lados abajo (en rem): abajo ≥ 0.75rem
    expect(padding).toHaveLength(3);
    expect(parseFloat(padding![2])).toBeGreaterThanOrEqual(0.75);
  });
});
