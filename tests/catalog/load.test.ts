import { afterEach, describe, expect, it, vi } from "vitest";
import { loadCatalog } from "../../src/lib/catalog/load";
import { createMemoryWorksStore } from "../../src/lib/works/store";
import type { NewWork } from "../../src/lib/works/store";

const work = (id: string, over: Partial<NewWork> = {}): NewWork => ({
  id,
  categoryId: 1,
  title: id,
  description: null,
  photoVersion: 1,
  photoExt: "webp",
  createdAt: 1,
  ...over,
});

afterEach(() => vi.restoreAllMocks());

describe("loadCatalog", () => {
  it("lista activos, más reciente primero", async () => {
    const store = createMemoryWorksStore();
    await store.insertWork(work("a", { createdAt: 1 }));
    await store.insertWork(work("b", { createdAt: 2 }));
    await store.insertWork(work("c", { createdAt: 3, retiredAt: 5 }));
    const data = await loadCatalog(store, {});
    expect(data.state).toBe("items");
    expect(data.cards.map((c) => c.id)).toEqual(["b", "a"]);
    expect(data.categories).toHaveLength(5);
    expect(data.active).toBeNull();
  });

  it("filtra por categoría", async () => {
    const store = createMemoryWorksStore();
    await store.insertWork(work("a", { categoryId: 1 }));
    await store.insertWork(work("b", { categoryId: 2 }));
    const data = await loadCatalog(store, { categoria: "postres" });
    expect(data.cards.map((c) => c.id)).toEqual(["b"]);
    expect(data.active).toBe("postres");
  });

  it("categoría desconocida equivale a Todos", async () => {
    const store = createMemoryWorksStore();
    await store.insertWork(work("a"));
    const data = await loadCatalog(store, { categoria: "xyz" });
    expect(data.state).toBe("items");
    expect(data.active).toBeNull();
  });

  it("base vacía: estado empty con las categorías", async () => {
    const data = await loadCatalog(createMemoryWorksStore(), {});
    expect(data.state).toBe("empty");
    expect(data.categories).toHaveLength(5);
  });

  it("categoría sin trabajos: emptyCategory", async () => {
    const store = createMemoryWorksStore();
    await store.insertWork(work("a", { categoryId: 1 }));
    const data = await loadCatalog(store, { categoria: "rollos" });
    expect(data.state).toBe("emptyCategory");
    expect(data.active).toBe("rollos");
  });

  it("pagina de 24 en 24 e indica si hay más", async () => {
    const store = createMemoryWorksStore();
    for (let i = 0; i < 30; i++) {
      await store.insertWork(work(`w${i}`, { createdAt: i }));
    }
    const first = await loadCatalog(store, {});
    expect(first.cards).toHaveLength(24);
    expect(first.hasMore).toBe(true);
    const second = await loadCatalog(store, { pagina: "2" });
    expect(second.cards).toHaveLength(30);
    expect(second.hasMore).toBe(false);
  });

  it("un fallo de D1 da state error sin lanzar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createMemoryWorksStore();
    store.failList = true;
    const data = await loadCatalog(store, {});
    expect(data.state).toBe("error");
    expect(console.error).toHaveBeenCalled();
  });
});
