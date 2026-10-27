import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// El layout real se comprueba en el navegador; aquí se protege la regla que iguala las fotos:
// un cuadro 1:1 que recorta, con la imagen absoluta y rellenándolo (400×300 y 400×533 deben verse igual).
const css = readFileSync("src/styles/global.css", "utf8");
const rule = (selector: string) =>
  css.match(
    new RegExp(`${selector.replace(/[.]/g, "\\.")}\\s*\\{([^}]*)\\}`),
  )?.[1] ?? "";

describe("fotos del catálogo del mismo tamaño", () => {
  it("el cuadro es 1:1 y recorta lo que sobra", () => {
    const box = rule(".photo-box");
    expect(box).toMatch(/aspect-ratio:\s*1/);
    expect(box).toMatch(/overflow:\s*hidden/);
    expect(box).toMatch(/position:\s*relative/);
  });

  it("la imagen llena el cuadro sin deformarse ni empujarlo", () => {
    const img = rule(".photo-box img");
    expect(img).toMatch(/position:\s*absolute/);
    expect(img).toMatch(/inset:\s*0/);
    expect(img).toMatch(/object-fit:\s*cover/);
  });
});
