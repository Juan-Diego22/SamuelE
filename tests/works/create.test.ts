import { describe, expect, it } from "vitest";
import { createWork } from "../../src/lib/works/create";
import {
  createMemoryMediaStore,
  createMemoryWorksStore,
} from "../../src/lib/works/store";

const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";
const NOW = 1_800_000_000_000;

const ascii = (t: string) => [...t].map((c) => c.charCodeAt(0));
const jpegBytes = () =>
  new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xda, 0, 2, 1, 2, 0xff, 0xd9,
  ]);
const exifJpegBytes = () =>
  new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe1,
    0,
    8,
    ...ascii("Exif\0\0"),
    0xff,
    0xd9,
  ]);

function setup() {
  const worksStore = createMemoryWorksStore();
  const mediaStore = createMemoryMediaStore();
  const run = (overrides: Partial<Parameters<typeof createWork>[0]> = {}) =>
    createWork({
      worksStore,
      mediaStore,
      fields: { id: ID, category: "1", title: "", description: "" },
      original: exifJpegBytes(),
      derivatives: { sm: jpegBytes(), md: jpegBytes(), lg: jpegBytes() },
      now: NOW,
      ...overrides,
    });
  return { worksStore, mediaStore, run };
}

describe("createWork", () => {
  it("con solo foto y categoría crea el trabajo y sus cuatro archivos", async () => {
    const { worksStore, mediaStore, run } = setup();
    expect(await run()).toEqual({ status: "created", id: ID });
    expect(worksStore.works.get(ID)).toEqual({
      id: ID,
      categoryId: 1,
      title: null,
      description: null,
      photoVersion: 1,
      photoExt: "jpg",
      createdAt: NOW,
    });
    expect([...mediaStore.files.keys()].sort()).toEqual([
      `originals/${ID}-1.jpg`,
      `works/${ID}-1/lg.jpg`,
      `works/${ID}-1/md.jpg`,
      `works/${ID}-1/sm.jpg`,
    ]);
  });

  it("escribe R2 antes que D1", async () => {
    const { worksStore, mediaStore, run } = setup();
    const originalInsert = worksStore.insertWork;
    let filesAtInsert = -1;
    worksStore.insertWork = async (work) => {
      filesAtInsert = mediaStore.files.size;
      return originalInsert(work);
    };
    await run();
    expect(filesAtInsert).toBe(4);
  });

  it("si falla una escritura de R2 borra lo escrito y no deja fila", async () => {
    const { worksStore, mediaStore, run } = setup();
    mediaStore.failPutOn = "md.jpg";
    expect(await run()).toEqual({ status: "unavailable" });
    expect(mediaStore.files.size).toBe(0);
    expect(worksStore.works.size).toBe(0);
  });

  it("si falla D1 borra las cuatro claves de R2", async () => {
    const { worksStore, mediaStore, run } = setup();
    worksStore.failInsert = true;
    expect(await run()).toEqual({ status: "unavailable" });
    expect(mediaStore.files.size).toBe(0);
  });

  it("registra si además falla la limpieza", async () => {
    const { worksStore, mediaStore, run } = setup();
    worksStore.failInsert = true;
    mediaStore.failDelete = true;
    const logs: string[] = [];
    expect(await run({ log: (m) => logs.push(m) })).toEqual({
      status: "unavailable",
    });
    expect(logs.some((m) => m.includes("deshacer"))).toBe(true);
  });

  it("un segundo envío con el mismo id es éxito sin escribir de nuevo", async () => {
    const { worksStore, mediaStore, run } = setup();
    await run();
    const before = new Map(mediaStore.files);
    mediaStore.files.clear(); // si volviera a escribir, aparecerían archivos
    expect(await run({ now: NOW + 5000 })).toEqual({
      status: "created",
      id: ID,
    });
    expect(mediaStore.files.size).toBe(0);
    expect(before.size).toBe(4);
    expect(worksStore.works.size).toBe(1);
    expect(worksStore.works.get(ID)?.createdAt).toBe(NOW);
  });

  it("no escribe nada si un campo o una foto son inválidos", async () => {
    const { worksStore, mediaStore, run } = setup();
    expect(await run({ original: undefined })).toMatchObject({
      status: "invalid",
      field: "original",
    });
    expect(
      await run({
        fields: { id: ID, category: "", title: "", description: "" },
      }),
    ).toMatchObject({ status: "invalid", field: "category" });
    expect(
      await run({
        derivatives: { sm: exifJpegBytes(), md: jpegBytes(), lg: jpegBytes() },
      }),
    ).toMatchObject({ status: "invalid", field: "photo" });
    expect(mediaStore.files.size).toBe(0);
    expect(worksStore.works.size).toBe(0);
  });
});
