import { describe, expect, it } from "vitest";
import { createMemoryWorksStore } from "../../src/lib/works/store";
import type { NewWork } from "../../src/lib/works/store";

const work = (id: string, over: Partial<NewWork> = {}): NewWork => ({
  id,
  categoryId: 1,
  title: id,
  description: null,
  photoVersion: 1,
  photoExt: "webp",
  createdAt: 1000,
  ...over,
});

async function seed() {
  const store = createMemoryWorksStore();
  await store.insertWork(work("a", { categoryId: 1, createdAt: 1 }));
  await store.insertWork(work("b", { categoryId: 2, createdAt: 2 }));
  await store.insertWork(work("c", { categoryId: 1, createdAt: 3 }));
  await store.insertWork(
    work("d", { categoryId: 1, createdAt: 4, retiredAt: 99 }),
  );
  return store;
}

describe("listWorks con categoría", () => {
  it("filtra por categoría, sin retirados y el más reciente primero", async () => {
    const store = await seed();
    expect((await store.listWorks(10, 1)).map((w) => w.id)).toEqual(["c", "a"]);
    expect((await store.listWorks(10, 2)).map((w) => w.id)).toEqual(["b"]);
  });

  it("sin categoría devuelve todos los activos", async () => {
    const store = await seed();
    expect((await store.listWorks(10)).map((w) => w.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("respeta el límite", async () => {
    const store = await seed();
    expect(await store.listWorks(1, 1)).toHaveLength(1);
  });

  it("una categoría sin trabajos devuelve vacío", async () => {
    const store = await seed();
    expect(await store.listWorks(10, 3)).toEqual([]);
  });
});
