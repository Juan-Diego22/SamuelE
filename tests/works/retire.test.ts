import { describe, expect, it } from "vitest";
import { retireWork } from "../../src/lib/works/retire";
import {
  createMemoryMediaStore,
  createMemoryWorksStore,
} from "../../src/lib/works/store";

const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";
const NOW = 1_800_000_000_000;

async function setup() {
  const worksStore = createMemoryWorksStore();
  await worksStore.insertWork({
    id: ID,
    categoryId: 1,
    title: "Torta",
    description: null,
    photoVersion: 1,
    photoExt: "webp",
    createdAt: 1000,
  });
  return worksStore;
}

describe("retireWork", () => {
  it("retira y el trabajo deja de salir en la lista", async () => {
    const worksStore = await setup();
    expect(await retireWork({ worksStore, id: ID, now: NOW })).toEqual({
      status: "retired",
    });
    expect(await worksStore.listWorks(10)).toEqual([]);
    expect(worksStore.works.get(ID)?.retiredAt).toBe(NOW);
  });

  it("inexistente o ya retirado → not_available", async () => {
    const worksStore = await setup();
    const other = "11111111-1111-4111-8111-111111111111";
    expect(await retireWork({ worksStore, id: other, now: NOW })).toEqual({
      status: "not_available",
    });
    await retireWork({ worksStore, id: ID, now: NOW });
    expect(await retireWork({ worksStore, id: ID, now: NOW })).toEqual({
      status: "not_available",
    });
  });

  it("un id que no es UUID no consulta el almacén", async () => {
    const worksStore = await setup();
    worksStore.retireWork = async () => {
      throw new Error("no debía consultarse");
    };
    expect(await retireWork({ worksStore, id: "abc", now: NOW })).toEqual({
      status: "not_available",
    });
  });

  it("si el almacén falla → unavailable y el trabajo sigue en la lista", async () => {
    const worksStore = await setup();
    worksStore.failRetire = true;
    const logs: string[] = [];
    expect(
      await retireWork({
        worksStore,
        id: ID,
        now: NOW,
        log: (m) => logs.push(m),
      }),
    ).toEqual({ status: "unavailable" });
    expect(logs).toHaveLength(1);
    expect(await worksStore.listWorks(10)).toHaveLength(1);
  });

  it("no toca los archivos de R2", async () => {
    const worksStore = await setup();
    const mediaStore = createMemoryMediaStore();
    mediaStore.files.set(`works/${ID}-1/sm.webp`, {
      bytes: new Uint8Array([1]),
      contentType: "image/webp",
    });
    mediaStore.failDelete = true; // si se llamara a delete, lanzaría
    await retireWork({ worksStore, id: ID, now: NOW });
    expect(mediaStore.files.size).toBe(1);
  });
});
