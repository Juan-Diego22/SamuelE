import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import BaseLayout from "../src/layouts/BaseLayout.astro";
import CatalogView from "../src/components/CatalogView.astro";
import { toCatalogCategories } from "../src/lib/catalog/categories";
import { DEFAULT_CATEGORIES } from "../src/lib/works/store";

// La página lee `cloudflare:workers`; se prueba el mismo contenido con los componentes.
async function renderHome() {
  const container = await AstroContainer.create();
  const body = await container.renderToString(CatalogView, {
    props: {
      data: {
        state: "empty",
        categories: toCatalogCategories(DEFAULT_CATEGORIES, null),
        cards: [],
        hasMore: false,
        page: 1,
        active: null,
      },
    },
  });
  return container.renderToString(BaseLayout, {
    props: { title: "Samuelé Repostería", variant: "catalog" },
    slots: { default: body },
  });
}

describe("página de inicio", () => {
  it("muestra nombre, lema y el catálogo en lugar del aviso de 'muy pronto'", async () => {
    const html = await renderHome();
    expect(html).toContain("Samuelé Repostería");
    expect(html).toContain("Creamos momentos dulces");
    expect(html).not.toContain("Nuestro catálogo estará disponible muy pronto");
    expect(html).toContain('aria-label="Categorías"');
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
