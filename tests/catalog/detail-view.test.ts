import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import DetailView from "../../src/components/DetailView.astro";
import type { DetailData } from "../../src/lib/catalog/detail";

const found = (over: Record<string, unknown> = {}): DetailData => ({
  state: "found",
  view: {
    title: "Torta de Chocolate",
    category: "Tortas",
    description: "Con ganache\nlínea dos <b>x</b>",
    photoMd: "/media/works/a-1/md.webp",
    photoLg: "/media/works/a-1/lg.webp",
    alt: "Torta de Chocolate — Tortas",
    whatsappUrl: "https://wa.me/573165441337?text=Hola",
    ...over,
  },
});

async function render(data: DetailData, retryHref?: string) {
  const container = await AstroContainer.create();
  return container.renderToString(DetailView, { props: { data, retryHref } });
}

describe("detalle", () => {
  it("muestra foto con srcset, categoría, título y descripción", async () => {
    const html = await render(found());
    expect(html).toContain(
      'srcset="/media/works/a-1/md.webp 900w, /media/works/a-1/lg.webp 1600w"',
    );
    expect(html).toContain('alt="Torta de Chocolate — Tortas"');
    expect(html).toContain(">Tortas</p>");
    expect(html).toMatch(/<h1[^>]*>Torta de Chocolate<\/h1>/);
    expect(html).toContain("Con ganache");
  });

  it("la descripción se muestra como texto literal (escapada)", async () => {
    const html = await render(found());
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>x</b>");
  });

  it("sin descripción no hay párrafo de descripción", async () => {
    const html = await render(found({ description: undefined }));
    expect(html).not.toContain("detail-description");
  });

  it("botón de WhatsApp, indicación de cotización y 'Volver' al catálogo", async () => {
    const html = await render(found());
    expect(html).toContain('href="https://wa.me/573165441337?text=Hola"');
    expect(html).toContain("Preguntar por WhatsApp");
    // la leyenda de cotización vive solo en el pie del catálogo
    expect(html).not.toContain("Cotiza por WhatsApp");
    expect(html).toMatch(/href="\/" data-back/);
    expect(html).toContain("← Volver");
    expect(html).not.toMatch(/\$|precio/i);
  });

  it("notFound: mensaje y botón, sin datos del trabajo", async () => {
    const html = await render({ state: "notFound" });
    expect(html).toContain("Este trabajo ya no está disponible.");
    expect(html).toMatch(/href="\/"[^>]*>\s*Ver el catálogo/);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("Torta de Chocolate");
  });

  it("error: mensaje distinto con Reintentar y Ver el catálogo", async () => {
    const html = await render({ state: "error" }, "/trabajos/x");
    expect(html).toContain(
      "No pudimos cargar este trabajo. Intenta de nuevo en un momento.",
    );
    expect(html).not.toContain("ya no está disponible");
    expect(html).toContain('href="/trabajos/x"');
    expect(html).toContain("Ver el catálogo");
  });
});
