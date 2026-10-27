import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import CatalogView from "../../src/components/CatalogView.astro";
import DetailView from "../../src/components/DetailView.astro";
import SiteFooter from "../../src/components/SiteFooter.astro";
import { toCatalogCategories } from "../../src/lib/catalog/categories";
import type { CatalogData } from "../../src/lib/catalog/load";
import { SITE } from "../../src/lib/site/contact";
import { DEFAULT_CATEGORIES } from "../../src/lib/works/store";

const data = (state: CatalogData["state"]): CatalogData => ({
  state,
  categories: toCatalogCategories(DEFAULT_CATEGORIES, null),
  cards: [],
  hasMore: false,
  page: 1,
  active: null,
});

async function render(
  component: Parameters<AstroContainer["renderToString"]>[0],
  props = {},
) {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props });
}

describe("pie del catálogo", () => {
  it("CONTACTO con el WhatsApp tocable y la leyenda", async () => {
    const html = await render(SiteFooter);
    expect(html).toContain("CONTACTO");
    expect(html).toContain("+57 316 544 1337");
    expect(html).toContain(
      `href="https://wa.me/573165441337?text=${encodeURIComponent(SITE.messages.general)}"`,
    );
    expect(html).toContain("Cotiza por WhatsApp");
  });

  it("no incluye teléfono aparte, zona, anticipación, precios ni botón flotante", async () => {
    for (const state of ["items", "empty", "error"] as const) {
      const html = await render(CatalogView, { data: data(state) });
      expect(html).not.toMatch(
        /tel:|Tel[eé]fono|ZONA DE ATENCI|ANTICIPACI|llamada/i,
      );
      expect(html).not.toMatch(/\$|fab|flotante/i);
    }
  });

  it("aparece en todos los estados del catálogo", async () => {
    for (const state of ["items", "empty", "emptyCategory", "error"] as const) {
      const html = await render(CatalogView, { data: data(state) });
      expect(html).toContain("CONTACTO");
    }
  });

  it("el detalle no lleva el pie", async () => {
    const html = await render(DetailView, { data: { state: "notFound" } });
    expect(html).not.toContain("CONTACTO");
  });
});
