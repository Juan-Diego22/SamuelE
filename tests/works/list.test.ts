import { describe, expect, it } from "vitest";
import { toPanelItems } from "../../src/lib/works/list";
import type { ListedWork } from "../../src/lib/works/store";

const row = (over: Partial<ListedWork>): ListedWork => ({
  id: "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f",
  categoryId: 1,
  categoryName: "Tortas",
  title: "Torta de fresa",
  description: null,
  photoVersion: 1,
  photoExt: "webp",
  createdAt: 1000,
  ...over,
});

describe("toPanelItems", () => {
  it("ordena del más reciente al más antiguo", () => {
    const items = toPanelItems([
      row({ id: "a", createdAt: 1 }),
      row({ id: "c", createdAt: 3 }),
      row({ id: "b", createdAt: 2 }),
    ]);
    expect(items.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("usa la categoría como título cuando no hay título", () => {
    const [item] = toPanelItems([
      row({ title: null, categoryName: "Postres" }),
    ]);
    expect(item.title).toBe("Postres");
    expect(item.category).toBe("Postres");
  });

  it("enlaza a la página de edición", () => {
    const [item] = toPanelItems([row({})]);
    expect(item.editHref).toBe(
      "/admin/works/3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f/edit",
    );
  });

  it("el orden no cambia al editar (sigue el createdAt)", () => {
    const items = toPanelItems([
      row({ id: "a", createdAt: 1, title: "Editado después" }),
      row({ id: "b", createdAt: 2 }),
    ]);
    expect(items.map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("arma la URL de la miniatura", () => {
    const [item] = toPanelItems([row({ photoExt: "jpg", photoVersion: 2 })]);
    expect(item.thumbnailUrl).toBe(
      "/media/works/3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f-2/sm.jpg",
    );
  });
});
