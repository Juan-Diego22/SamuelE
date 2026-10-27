import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import BaseLayout from "../../src/layouts/BaseLayout.astro";
import { shareDescription } from "../../src/lib/catalog/detail";
import type { DetailView } from "../../src/lib/catalog/detail";

const ORIGIN = "https://samuele.example";

async function head(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props,
    request: new Request(`${ORIGIN}/`),
  });
}

const view = (over: Partial<DetailView> = {}): DetailView => ({
  title: "Torta",
  category: "Tortas",
  photoMd: "/media/works/a-1/md.webp",
  photoLg: "/media/works/a-1/lg.webp",
  alt: "x",
  whatsappUrl: "https://wa.me/1",
  ...over,
});

describe("vista previa al compartir", () => {
  it("la portada trae descripción, Open Graph e imagen absoluta", async () => {
    const html = await head({
      title: "Samuelé Repostería",
      description:
        "Creamos momentos dulces. Mira nuestros trabajos y pregunta por WhatsApp.",
      image: "/og-logo.jpg",
    });
    expect(html).toContain(
      '<meta name="description" content="Creamos momentos dulces. Mira nuestros trabajos y pregunta por WhatsApp.">',
    );
    expect(html).toContain('property="og:title" content="Samuelé Repostería"');
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('property="og:locale" content="es_CO"');
    expect(html).toContain(
      `property="og:image" content="${ORIGIN}/og-logo.jpg"`,
    );
  });

  it("el detalle usa el título y la foto md del trabajo", async () => {
    const html = await head({
      title: "Torta | Samuelé Repostería",
      description: "Con ganache",
      image: "/media/works/a-1/md.webp",
    });
    expect(html).toContain(
      `property="og:image" content="${ORIGIN}/media/works/a-1/md.webp"`,
    );
    expect(html).toContain('property="og:description" content="Con ganache"');
  });

  it("las comillas del título y la descripción se escapan y no rompen el atributo", async () => {
    const html = await head({
      title: 'Torta "Mamá"',
      description: 'a "b" <i>',
    });
    expect(html).not.toContain('content="a "b"');
    // `<` dentro de un atributo entre comillas es inofensivo: no abre una etiqueta.
    expect(html).toContain('content="a &quot;b&quot; <i>">');
    expect(html).toContain("&quot;");
  });

  it("sin descripción ni imagen (404) no emite etiquetas de vista previa", async () => {
    const html = await head({ title: "Trabajo no disponible | Samuelé" });
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("og:title");
    expect(html).not.toContain('name="description"');
  });
});

describe("shareDescription", () => {
  it("sin descripción usa la categoría", () => {
    expect(shareDescription(view())).toBe("Tortas de Samuelé Repostería");
  });

  it("quita saltos de línea y respeta ≤150 caracteres sin cortar palabras", () => {
    const long = Array.from({ length: 60 }, () => "palabra").join("\n");
    const text = shareDescription(view({ description: long }));
    expect(text.length).toBeLessThanOrEqual(150);
    expect(text).not.toMatch(/\n/);
    expect(text.endsWith("…")).toBe(true);
    expect(text.slice(0, -1).endsWith("palabra")).toBe(true);
  });

  it("una descripción corta queda igual", () => {
    expect(shareDescription(view({ description: "Con ganache" }))).toBe(
      "Con ganache",
    );
  });
});
