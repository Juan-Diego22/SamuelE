import { describe, expect, it } from "vitest";
import { updateWork } from "../../src/lib/works/update";
import {
  createMemoryMediaStore,
  createMemoryWorksStore,
} from "../../src/lib/works/store";

const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";
const CREATED = 1000;

const ascii = (t: string) => [...t].map((c) => c.charCodeAt(0));
const jpegBytes = () =>
  new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xda, 0, 2, 1, 2, 0xff, 0xd9,
  ]);
const otherJpegBytes = () =>
  new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xda, 0, 2, 7, 8, 0xff, 0xd9,
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

const fields = { category: "2", title: "Nuevo título", description: "" };
const photoArgs = () => ({
  baseVersion: 1,
  original: exifJpegBytes(),
  derivatives: { sm: jpegBytes(), md: jpegBytes(), lg: jpegBytes() },
});

async function setup() {
  const worksStore = createMemoryWorksStore();
  const mediaStore = createMemoryMediaStore();
  // Trabajo publicado con foto webp en versión 1.
  await worksStore.insertWork({
    id: ID,
    categoryId: 1,
    title: "Torta",
    description: "Rica",
    photoVersion: 1,
    photoExt: "webp",
    createdAt: CREATED,
  });
  const old = [
    `originals/${ID}-1.jpg`,
    `works/${ID}-1/sm.webp`,
    `works/${ID}-1/md.webp`,
    `works/${ID}-1/lg.webp`,
  ];
  for (const key of old) {
    mediaStore.files.set(key, { bytes: new Uint8Array([1]), contentType: "x" });
  }
  const run = (over: Partial<Parameters<typeof updateWork>[0]> = {}) =>
    updateWork({
      worksStore,
      mediaStore,
      id: ID,
      baseVersion: undefined,
      fields,
      original: undefined,
      derivatives: {},
      ...over,
    });
  return { worksStore, mediaStore, run, old };
}

describe("updateWork sin foto", () => {
  it("cambia solo categoría, título y descripción, sin tocar R2", async () => {
    const { worksStore, mediaStore, run, old } = await setup();
    const puts: string[] = [];
    const put = mediaStore.put;
    mediaStore.put = async (...args) => {
      puts.push(args[0]);
      return put(...args);
    };
    expect(await run()).toEqual({ status: "updated", photoVersion: 1 });
    expect(worksStore.works.get(ID)).toMatchObject({
      categoryId: 2,
      title: "Nuevo título",
      description: null,
      photoVersion: 1,
      photoExt: "webp",
      createdAt: CREATED,
    });
    expect(puts).toEqual([]);
    expect([...mediaStore.files.keys()].sort()).toEqual([...old].sort());
  });

  it("título vacío o solo espacios → invalid y nada cambia", async () => {
    const { worksStore, run } = await setup();
    for (const title of ["", "   "]) {
      expect(await run({ fields: { ...fields, title } })).toEqual({
        status: "invalid",
        field: "title",
        message: "Escribe un título.",
      });
    }
    expect(worksStore.works.get(ID)?.title).toBe("Torta");
  });

  it("trabajo retirado, inexistente o id inválido → not_available", async () => {
    const { worksStore, run } = await setup();
    expect(await run({ id: "abc" })).toEqual({ status: "not_available" });
    expect(await run({ id: "11111111-1111-4111-8111-111111111111" })).toEqual({
      status: "not_available",
    });
    await worksStore.retireWork(ID, 5000);
    expect(await run()).toEqual({ status: "not_available" });
  });

  it("falla de D1 → unavailable", async () => {
    const { worksStore, run } = await setup();
    worksStore.failUpdate = true;
    expect(await run()).toEqual({ status: "unavailable" });
  });
});

describe("updateWork con foto nueva", () => {
  it("escribe la versión siguiente y borra la anterior con su extensión", async () => {
    const { worksStore, mediaStore, run } = await setup();
    expect(await run(photoArgs())).toEqual({
      status: "updated",
      photoVersion: 2,
    });
    expect(worksStore.works.get(ID)).toMatchObject({
      photoVersion: 2,
      photoExt: "jpg",
      createdAt: CREATED,
    });
    expect([...mediaStore.files.keys()].sort()).toEqual([
      `originals/${ID}-2.jpg`,
      `works/${ID}-2/lg.jpg`,
      `works/${ID}-2/md.jpg`,
      `works/${ID}-2/sm.jpg`,
    ]);
  });

  it("escribe R2 antes de actualizar D1 y borra lo viejo después", async () => {
    const { worksStore, mediaStore, run } = await setup();
    const events: string[] = [];
    const update = worksStore.updateWork;
    worksStore.updateWork = async (...args) => {
      events.push(`d1:${mediaStore.files.size}`);
      return update(...args);
    };
    const del = mediaStore.delete;
    mediaStore.delete = async (keys) => {
      events.push("delete");
      return del(keys);
    };
    await run(photoArgs());
    expect(events).toEqual(["d1:8", "delete"]);
  });

  it("foto con EXIF en una derivada → invalid photo y todo igual", async () => {
    const { worksStore, mediaStore, run, old } = await setup();
    const args = photoArgs();
    args.derivatives.sm = exifJpegBytes();
    expect(await run(args)).toMatchObject({
      status: "invalid",
      field: "photo",
    });
    expect(worksStore.works.get(ID)?.photoVersion).toBe(1);
    expect([...mediaStore.files.keys()].sort()).toEqual([...old].sort());
  });

  it("derivadas incompletas → invalid photo", async () => {
    const { run } = await setup();
    const args: Partial<Parameters<typeof run>[0]> = {
      ...photoArgs(),
      derivatives: { sm: jpegBytes(), md: jpegBytes() },
    };
    expect(await run(args)).toMatchObject({
      status: "invalid",
      field: "photo",
    });
    const noOriginal = { ...photoArgs(), original: undefined };
    expect(await run(noOriginal)).toMatchObject({
      status: "invalid",
      field: "photo",
    });
  });

  it("falla un put a mitad → se borra lo escrito y el trabajo no cambia", async () => {
    const { worksStore, mediaStore, run, old } = await setup();
    mediaStore.failPutOn = "md.jpg";
    expect(await run(photoArgs())).toEqual({ status: "unavailable" });
    expect(worksStore.works.get(ID)).toMatchObject({
      title: "Torta",
      photoVersion: 1,
      photoExt: "webp",
    });
    expect([...mediaStore.files.keys()].sort()).toEqual([...old].sort());
  });

  it("falla D1 → se borra la versión nueva y la anterior sigue", async () => {
    const { worksStore, mediaStore, run, old } = await setup();
    worksStore.failUpdate = true;
    expect(await run(photoArgs())).toEqual({ status: "unavailable" });
    expect([...mediaStore.files.keys()].sort()).toEqual([...old].sort());
  });

  it("mismo guardado repetido → éxito sin escribir", async () => {
    const { mediaStore, run } = await setup();
    await run(photoArgs());
    const before = [...mediaStore.files.keys()].sort();
    expect(await run(photoArgs())).toEqual({
      status: "updated",
      photoVersion: 2,
    });
    expect([...mediaStore.files.keys()].sort()).toEqual(before);
  });

  it("otra foto sobre la versión ya avanzada por otra pestaña → conflict", async () => {
    const { mediaStore, run } = await setup();
    await run(photoArgs());
    const other = {
      ...photoArgs(),
      derivatives: {
        sm: otherJpegBytes(),
        md: jpegBytes(),
        lg: jpegBytes(),
      },
    };
    expect(await run(other)).toEqual({ status: "conflict" });
    expect(mediaStore.files.get(`works/${ID}-2/sm.jpg`)?.bytes).toEqual(
      jpegBytes(),
    );
  });

  it("baseVersion distinta → conflict sin dejar archivos", async () => {
    const { mediaStore, run, old } = await setup();
    expect(await run({ ...photoArgs(), baseVersion: 3 })).toEqual({
      status: "conflict",
    });
    expect(await run({ ...photoArgs(), baseVersion: undefined })).toEqual({
      status: "conflict",
    });
    expect([...mediaStore.files.keys()].sort()).toEqual([...old].sort());
  });

  it("si D1 detecta el choque tras escribir, deshace lo escrito", async () => {
    const { worksStore, mediaStore, run, old } = await setup();
    worksStore.updateWork = async () => "conflict";
    expect(await run(photoArgs())).toEqual({ status: "conflict" });
    expect([...mediaStore.files.keys()].sort()).toEqual([...old].sort());
  });

  it("si otro guardado idéntico ganó la carrera, no borra sus archivos", async () => {
    const { worksStore, mediaStore, run } = await setup();
    const update = worksStore.updateWork;
    worksStore.updateWork = async (id, patch, expected) => {
      // El ganador aplica su versión 2 justo antes que nosotros.
      await update(id, { ...patch, photo: { version: 2, ext: "jpg" } }, 1);
      return update(id, patch, expected);
    };
    expect(await run(photoArgs())).toEqual({ status: "conflict" });
    expect(mediaStore.files.has(`works/${ID}-2/md.jpg`)).toBe(true);
  });

  it("trabajo retirado → not_available", async () => {
    const { worksStore, mediaStore, run } = await setup();
    await worksStore.retireWork(ID, 5000);
    expect(await run(photoArgs())).toEqual({ status: "not_available" });
    expect(mediaStore.files.size).toBe(4);
  });

  it("si falla el borrado de la versión anterior sigue siendo éxito y se registra", async () => {
    const { mediaStore, run } = await setup();
    const logs: string[] = [];
    const del = mediaStore.delete;
    mediaStore.delete = async () => {
      throw new Error("fallo forzado de R2");
    };
    expect(await run({ ...photoArgs(), log: (m) => logs.push(m) })).toEqual({
      status: "updated",
      photoVersion: 2,
    });
    mediaStore.delete = del;
    expect(logs.some((m) => m.includes("foto anterior"))).toBe(true);
  });
});
