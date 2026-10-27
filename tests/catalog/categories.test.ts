import { describe, expect, it } from "vitest";
import {
  categorySlug,
  resolveCategory,
  toCatalogCategories,
} from "../../src/lib/catalog/categories";
import { DEFAULT_CATEGORIES } from "../../src/lib/works/store";

describe("categorySlug", () => {
  it("pasa a minúsculas y quita tildes", () => {
    expect(categorySlug("Tortas")).toBe("tortas");
    expect(categorySlug("Postres Frías")).toBe("postres-frias");
    expect(categorySlug("Ñoños")).toBe("nonos");
  });
});

describe("resolveCategory", () => {
  it("encuentra la categoría por su slug", () => {
    expect(resolveCategory(DEFAULT_CATEGORIES, "tortas")?.id).toBe(1);
  });

  it("valores desconocidos, vacíos o ausentes equivalen a Todos", () => {
    expect(resolveCategory(DEFAULT_CATEGORIES, "xyz")).toBeNull();
    expect(resolveCategory(DEFAULT_CATEGORIES, "")).toBeNull();
    expect(resolveCategory(DEFAULT_CATEGORIES, undefined)).toBeNull();
    expect(resolveCategory(DEFAULT_CATEGORIES, null)).toBeNull();
  });
});

describe("toCatalogCategories", () => {
  it("pone Todos primero y marca la activa", () => {
    const list = toCatalogCategories(DEFAULT_CATEGORIES, "postres");
    expect(list.map((c) => c.name)).toEqual([
      "Todos",
      "Tortas",
      "Postres",
      "Rollos",
      "Otros",
    ]);
    expect(list[0]).toMatchObject({ href: "/", active: false });
    expect(list[2]).toMatchObject({
      href: "/?categoria=postres",
      active: true,
    });
  });

  it("sin filtro Todos está activa y todas las categorías siguen visibles", () => {
    const list = toCatalogCategories(DEFAULT_CATEGORIES, null);
    expect(list.filter((c) => c.active).map((c) => c.name)).toEqual(["Todos"]);
    expect(list).toHaveLength(5);
  });
});
