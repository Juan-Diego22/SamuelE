import { describe, expect, it } from "vitest";
import {
  CATALOG_CACHE_CONTROL,
  CATALOG_PAGE_SIZE,
  MAX_PAGE,
  pageLimit,
  parsePage,
  slicePage,
  toCatalogCards,
} from "../../src/lib/catalog/view";
import type { ListedWork } from "../../src/lib/works/store";

const row = (over: Partial<ListedWork> = {}): ListedWork => ({
  id: "a",
  categoryId: 1,
  categoryName: "Tortas",
  title: "Torta de fresa",
  description: "secreto",
  photoVersion: 2,
  photoExt: "webp",
  createdAt: 5,
  retiredAt: null,
  ...over,
});

describe("toCatalogCards", () => {
  it("conserva el orden y arma enlace, miniatura y texto alternativo", () => {
    const cards = toCatalogCards([row({ id: "b" }), row({ id: "a" })]);
    expect(cards.map((c) => c.id)).toEqual(["b", "a"]);
    expect(cards[0]).toEqual({
      id: "b",
      href: "/trabajos/b",
      title: "Torta de fresa",
      category: "Tortas",
      photoUrl: "/media/works/b-2/sm.webp",
      alt: "Torta de fresa — Tortas",
    });
  });

  it("sin título usa la categoría", () => {
    const [card] = toCatalogCards([row({ title: null })]);
    expect(card.title).toBe("Tortas");
    expect(card.alt).toBe("Tortas — Tortas");
  });

  it("al reemplazar la foto cambia la URL (FR-025)", () => {
    const [before] = toCatalogCards([row({ photoVersion: 1 })]);
    const [after] = toCatalogCards([row({ photoVersion: 2 })]);
    expect(after.photoUrl).not.toBe(before.photoUrl);
  });

  it("no expone campos internos (FR-032)", () => {
    const [card] = toCatalogCards([row({ retiredAt: 9 })]);
    expect(Object.keys(card).sort()).toEqual([
      "alt",
      "category",
      "href",
      "id",
      "photoUrl",
      "title",
    ]);
  });
});

describe("paginación", () => {
  it("parsePage acepta 1..MAX_PAGE y el resto es 1", () => {
    expect(parsePage("3")).toBe(3);
    for (const bad of [undefined, null, "", "0", "-2", "1.5", "abc"]) {
      expect(parsePage(bad)).toBe(1);
    }
    expect(parsePage("999")).toBe(MAX_PAGE);
    expect(MAX_PAGE).toBe(8);
  });

  it("pide uno más que la página", () => {
    expect(pageLimit(1)).toBe(CATALOG_PAGE_SIZE + 1);
    expect(pageLimit(2)).toBe(CATALOG_PAGE_SIZE * 2 + 1);
  });

  it("con 100 trabajos la primera página trae 24 y hay más (SC-010)", () => {
    const rows = Array.from({ length: 25 }, (_, i) => i);
    const { items, hasMore } = slicePage(rows, 1);
    expect(items).toHaveLength(24);
    expect(hasMore).toBe(true);
  });

  it("sin fila extra no hay más", () => {
    expect(slicePage([1, 2, 3], 1)).toEqual({
      items: [1, 2, 3],
      hasMore: false,
    });
  });
});

describe("caché", () => {
  it("las páginas públicas se revalidan siempre", () => {
    expect(CATALOG_CACHE_CONTROL).toBe("no-cache");
  });
});
