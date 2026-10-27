import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import CatalogView from "../../src/components/CatalogView.astro";
import { toCatalogCategories } from "../../src/lib/catalog/categories";
import type { CatalogData } from "../../src/lib/catalog/load";
import { DEFAULT_CATEGORIES } from "../../src/lib/works/store";

function data(over: Partial<CatalogData> = {}): CatalogData {
  return {
    state: "items",
    categories: toCatalogCategories(DEFAULT_CATEGORIES, null),
    cards: [
      {
        id: "a",
        href: "/trabajos/a",
        title: "Torta de fresa",
        category: "Tortas",
        photoUrl: "/media/works/a-1/sm.webp",
        alt: "Torta de fresa — Tortas",
      },
      {
        id: "b",
        href: "/trabajos/b",
        title: "Brownies",
        category: "Postres",
        photoUrl: "/media/works/b-1/sm.webp",
        alt: "Brownies — Postres",
      },
    ],
    hasMore: false,
    page: 1,
    active: null,
    ...over,
  };
}

async function render(d: CatalogData, retryHref?: string) {
  const container = await AstroContainer.create();
  return container.renderToString(CatalogView, {
    props: { data: d, retryHref },
  });
}

describe("catálogo", () => {
  it("cabecera con logo, nombre y lema", async () => {
    const html = await render(data());
    expect(html).toContain("Samuelé Repostería");
    expect(html).toContain("Creamos momentos dulces");
    expect(html).toMatch(/<img[^>]*alt="Logo de Samuelé Repostería"/);
  });

  it("categorías como enlaces y la activa marcada", async () => {
    const html = await render(
      data({ categories: toCatalogCategories(DEFAULT_CATEGORIES, "tortas") }),
    );
    expect(html).toContain('aria-label="Categorías"');
    for (const name of ["Todos", "Tortas", "Postres", "Rollos", "Otros"]) {
      expect(html).toContain(`>${name}</a>`);
    }
    expect(html).toContain('href="/?categoria=tortas"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("cada trabajo es un solo enlace con foto, título y categoría", async () => {
    const html = await render(data());
    expect(html).toContain('href="/trabajos/a"');
    expect(html).toContain('src="/media/works/a-1/sm.webp"');
    expect(html).toContain('alt="Torta de fresa — Tortas"');
    expect(html).toContain("Torta de fresa");
    expect(html).toContain("Brownies");
    expect(html.match(/<a class="catalog-card"/g)).toHaveLength(2);
    // el enlace no contiene otros enlaces
    expect(html).not.toMatch(
      /<a class="catalog-card"[^>]*>(?:(?!<\/a>).)*<a /s,
    );
  });

  it("cada tarjeta tiene un botón visible 'Ver detalles' dentro del mismo enlace", async () => {
    const html = await render(data());
    expect(html.match(/catalog-card-cta/g)).toHaveLength(2);
    expect(html.match(/Ver detalles/g)).toHaveLength(4); // texto visible + nombre accesible, por tarjeta
    expect(html).toContain('aria-label="Ver detalles: Torta de fresa"');
    expect(html).toContain('aria-label="Ver detalles: Brownies"');
    // el botón es decorativo: el nombre accesible del enlace ya lo dice
    expect(html).toMatch(/class="catalog-card-cta" aria-hidden="true"/);
  });

  it("estado vacío: mensaje, categorías y sin grilla", async () => {
    const html = await render(data({ state: "empty", cards: [] }));
    expect(html).toContain(
      "Estamos preparando nuestro catálogo. Muy pronto verás aquí nuestros trabajos.",
    );
    expect(html).toContain('aria-label="Categorías"');
    expect(html).not.toContain("catalog-grid");
  });

  it("categoría sin trabajos: mensaje y 'Ver todos'", async () => {
    const html = await render(
      data({
        state: "emptyCategory",
        cards: [],
        categories: toCatalogCategories(DEFAULT_CATEGORIES, "rollos"),
        active: "rollos",
      }),
    );
    expect(html).toContain("Todavía no hay trabajos en esta categoría.");
    expect(html).toMatch(/href="\/"[^>]*>\s*Ver todos/);
  });

  it("'Ver más' solo si hay más, conservando la categoría", async () => {
    const without = await render(data());
    expect(without).not.toContain("Ver más trabajos");
    const all = await render(data({ hasMore: true }));
    expect(all).toContain('href="/?pagina=2"');
    const filtered = await render(
      data({ hasMore: true, active: "tortas", page: 2 }),
    );
    expect(filtered).toContain('href="/?categoria=tortas&amp;pagina=3"');
  });

  it("no muestra precios", async () => {
    const html = await render(data());
    expect(html).not.toMatch(/\$|COP|precio/i);
  });
});
