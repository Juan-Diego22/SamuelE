import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import CatalogView from "../../src/components/CatalogView.astro";
import DetailView from "../../src/components/DetailView.astro";
import { toCatalogCategories } from "../../src/lib/catalog/categories";
import type { CatalogData } from "../../src/lib/catalog/load";
import { DEFAULT_CATEGORIES } from "../../src/lib/works/store";

const cards = Array.from({ length: 6 }, (_, i) => ({
  id: `w${i}`,
  href: `/trabajos/w${i}`,
  title: `Trabajo ${i}`,
  category: "Tortas",
  photoUrl: `/media/works/w${i}-1/sm.webp`,
  alt: `Trabajo ${i} — Tortas`,
}));

const data: CatalogData = {
  state: "items",
  categories: toCatalogCategories(DEFAULT_CATEGORIES, null),
  cards,
  hasMore: false,
  page: 1,
  active: null,
};

describe("imágenes del catálogo", () => {
  it("tamaño reservado, alt y carga diferida fuera de la primera pantalla", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CatalogView, {
      props: { data },
    });
    const imgs = [...html.matchAll(/<img[^>]*\/media\/[^>]*>/g)].map(
      (m) => m[0],
    );
    expect(imgs).toHaveLength(6);
    for (const img of imgs) {
      expect(img).toContain('width="400"');
      expect(img).toContain('height="400"');
      expect(img).toContain('decoding="async"');
      expect(img).toMatch(/alt="[^"]+"/);
      expect(img).toContain("data-photo");
    }
    imgs.slice(0, 4).forEach((img) => expect(img).not.toContain("lazy"));
    imgs.slice(4).forEach((img) => expect(img).toContain('loading="lazy"'));
    expect(imgs[0]).toContain('fetchpriority="high"');
    imgs.slice(1).forEach((img) => expect(img).not.toContain("fetchpriority"));
  });

  it("la foto del detalle no se difiere y trae srcset y sizes", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(DetailView, {
      props: {
        data: {
          state: "found",
          view: {
            title: "T",
            category: "Tortas",
            photoMd: "/media/works/a-1/md.webp",
            photoLg: "/media/works/a-1/lg.webp",
            alt: "T — Tortas",
            whatsappUrl: "https://wa.me/1",
          },
        },
      },
    });
    const img = html.match(/<img[^>]*>/)![0];
    expect(img).not.toContain("lazy");
    expect(img).toContain("srcset=");
    expect(img).toContain("sizes=");
    expect(img).toContain("data-photo");
  });
});
