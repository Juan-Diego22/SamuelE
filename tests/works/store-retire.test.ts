import { describe, expect, it } from "vitest";
import { createMemoryWorksStore } from "../../src/lib/works/store";
import type { NewWork } from "../../src/lib/works/store";

const work = (id: string, over: Partial<NewWork> = {}): NewWork => ({
  id,
  categoryId: 1,
  title: "Torta",
  description: "Rica",
  photoVersion: 1,
  photoExt: "webp",
  createdAt: 1000,
  ...over,
});

const patch = { categoryId: 2, title: "Nuevo", description: null };

async function setup() {
  const store = createMemoryWorksStore();
  await store.insertWork(work("a"));
  await store.insertWork(work("b", { createdAt: 2000 }));
  return store;
}

describe("retiro y edición en el almacén (en memoria)", () => {
  it("listWorks omite los retirados", async () => {
    const store = await setup();
    await store.retireWork("a", 5000);
    expect((await store.listWorks(10)).map((w) => w.id)).toEqual(["b"]);
  });

  it("getWork devuelve null para retirado e inexistente", async () => {
    const store = await setup();
    await store.retireWork("a", 5000);
    expect(await store.getWork("a")).toBeNull();
    expect(await store.getWork("zzz")).toBeNull();
    expect(await store.getWork("b")).toMatchObject({
      id: "b",
      categoryName: "Tortas",
    });
  });

  it("retireWork dos veces: retired y luego not_found; conserva los datos", async () => {
    const store = await setup();
    expect(await store.retireWork("a", 5000)).toBe("retired");
    expect(await store.retireWork("a", 6000)).toBe("not_found");
    expect(await store.retireWork("zzz", 6000)).toBe("not_found");
    expect(store.works.get("a")).toMatchObject({
      retiredAt: 5000,
      title: "Torta",
    });
  });

  it("updateWork cambia solo los campos dados y conserva createdAt", async () => {
    const store = await setup();
    expect(await store.updateWork("a", patch)).toBe("updated");
    expect(store.works.get("a")).toMatchObject({
      categoryId: 2,
      title: "Nuevo",
      description: null,
      photoVersion: 1,
      photoExt: "webp",
      createdAt: 1000,
    });
  });

  it("updateWork con foto cambia versión y extensión", async () => {
    const store = await setup();
    expect(
      await store.updateWork(
        "a",
        { ...patch, photo: { version: 2, ext: "jpg" } },
        1,
      ),
    ).toBe("updated");
    expect(store.works.get("a")).toMatchObject({
      photoVersion: 2,
      photoExt: "jpg",
      createdAt: 1000,
    });
  });

  it("updateWork devuelve conflict con otra versión y not_found si está retirado", async () => {
    const store = await setup();
    expect(
      await store.updateWork(
        "a",
        { ...patch, photo: { version: 4, ext: "jpg" } },
        3,
      ),
    ).toBe("conflict");
    expect(store.works.get("a")?.title).toBe("Torta");
    await store.retireWork("a", 5000);
    expect(await store.updateWork("a", patch)).toBe("not_found");
  });
});
