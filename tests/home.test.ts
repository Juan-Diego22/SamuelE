import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Index from "../src/pages/index.astro";

async function renderHome() {
  const container = await AstroContainer.create();
  return container.renderToString(Index);
}

describe("página de inicio", () => {
  it("muestra nombre, lema y mensaje de catálogo próximo", async () => {
    const html = await renderHome();
    expect(html).toContain("Samuelé Repostería");
    expect(html).toContain("Creamos momentos dulces");
    expect(html).toMatch(/catálogo/);
    expect(html).toMatch(/pronto/);
  });

  it("declara idioma español y viewport móvil", async () => {
    const html = await renderHome();
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<meta name="viewport"');
  });

  it("el logo tiene texto alternativo no vacío", async () => {
    const html = await renderHome();
    const img = html.match(/<img[^>]*>/);
    expect(img).not.toBeNull();
    expect(img![0]).toMatch(/alt="[^"]+"/);
  });
});
