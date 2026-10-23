import { describe, expect, it } from "vitest";
import { handleUpdateWork, MAX_BODY_BYTES } from "../../src/lib/works/api";
import { MESSAGES } from "../../src/lib/works/messages";
import {
  createMemoryMediaStore,
  createMemoryWorksStore,
} from "../../src/lib/works/store";

const SITE = "https://samuele.example";
const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";

const jpeg = () =>
  new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xda, 0, 2, 1, 2, 0xff, 0xd9,
  ]);
const blob = () => new Blob([jpeg()], { type: "image/jpeg" });

function formWith(overrides: Record<string, string | Blob | null> = {}) {
  const base: Record<string, string | Blob | null> = {
    category: "2",
    title: "Nuevo título",
    description: "",
  };
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value === null) continue;
    if (typeof value === "string") form.set(key, value);
    else form.set(key, value, `${key}.jpg`);
  }
  return form;
}

const withPhoto = (extra: Record<string, string | Blob | null> = {}) =>
  formWith({
    baseVersion: "1",
    original: blob(),
    sm: blob(),
    md: blob(),
    lg: blob(),
    ...extra,
  });

async function setup() {
  const worksStore = createMemoryWorksStore();
  const mediaStore = createMemoryMediaStore();
  await worksStore.insertWork({
    id: ID,
    categoryId: 1,
    title: "Torta",
    description: null,
    photoVersion: 1,
    photoExt: "webp",
    createdAt: 1000,
  });
  const put = (
    body: BodyInit | null,
    id = ID,
    headers: Record<string, string> = {},
  ) =>
    handleUpdateWork(
      new Request(`${SITE}/api/admin/works/${id}`, {
        method: "PUT",
        body,
        headers,
      }),
      id,
      { worksStore, mediaStore },
    );
  return { worksStore, mediaStore, put };
}

const errorOf = async (response: Response) =>
  ((await response.json()) as { error: { field: string; message: string } })
    .error;

describe("PUT /api/admin/works/{id}", () => {
  it("200 sin foto con la versión actual", async () => {
    const { worksStore, put } = await setup();
    const response = await put(formWith());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: ID, photoVersion: 1 });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(worksStore.works.get(ID)?.title).toBe("Nuevo título");
  });

  it("200 con foto nueva y la versión siguiente", async () => {
    const { mediaStore, put } = await setup();
    const response = await put(withPhoto());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: ID, photoVersion: 2 });
    expect(mediaStore.files.size).toBe(4);
  });

  it.each([
    ["título vacío", { title: "" }, "title"],
    ["categoría inválida", { category: "" }, "category"],
    [
      "derivada ausente",
      { baseVersion: "1", original: blob(), sm: blob() },
      "photo",
    ],
  ] as const)("422 con %s", async (_name, overrides, field) => {
    const { worksStore, put } = await setup();
    const response = await put(formWith(overrides));
    expect(response.status).toBe(422);
    expect((await errorOf(response)).field).toBe(field);
    expect(worksStore.works.get(ID)?.title).toBe("Torta");
  });

  it("404 si no existe, está retirado o el id no es UUID", async () => {
    const { worksStore, put } = await setup();
    for (const id of ["abc", "11111111-1111-4111-8111-111111111111"]) {
      const response = await put(formWith(), id);
      expect(response.status).toBe(404);
      expect(await errorOf(response)).toEqual({
        field: "form",
        message: MESSAGES.notAvailable,
      });
    }
    await worksStore.retireWork(ID, 5000);
    expect((await put(formWith())).status).toBe(404);
  });

  it("409 con baseVersion que no coincide", async () => {
    const { put } = await setup();
    const response = await put(withPhoto({ baseVersion: "7" }));
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toEqual({
      field: "form",
      message: MESSAGES.conflict,
    });
  });

  it("400 si no es multipart/form-data", async () => {
    const { put } = await setup();
    const response = await put("{}", ID, {
      "Content-Type": "application/json",
    });
    expect(response.status).toBe(400);
  });

  it("413 si Content-Length supera el tope, sin leer el cuerpo", async () => {
    const { worksStore, mediaStore } = await setup();
    let read = false;
    const request = new Request(`${SITE}/api/admin/works/${ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "multipart/form-data; boundary=x",
        "Content-Length": String(MAX_BODY_BYTES + 1),
      },
    });
    request.formData = async () => {
      read = true;
      return new FormData();
    };
    const response = await handleUpdateWork(request, ID, {
      worksStore,
      mediaStore,
    });
    expect(response.status).toBe(413);
    expect(read).toBe(false);
  });

  it("503 si falla R2 o D1", async () => {
    const r2 = await setup();
    r2.mediaStore.failPutOn = "sm.jpg";
    const a = await r2.put(withPhoto());
    expect(a.status).toBe(503);
    expect((await errorOf(a)).message).toBe(MESSAGES.saveFailed);
    expect(r2.mediaStore.files.size).toBe(0);

    const d1 = await setup();
    d1.worksStore.failUpdate = true;
    expect((await d1.put(formWith())).status).toBe(503);
  });
});
