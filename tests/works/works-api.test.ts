import { describe, expect, it } from "vitest";
import { guardRequest } from "../../src/lib/auth/guard";
import { createSession } from "../../src/lib/auth/sessions";
import { createMemoryStore } from "../../src/lib/auth/store";
import { handleCreateWork, MAX_BODY_BYTES } from "../../src/lib/works/api";
import { MESSAGES } from "../../src/lib/works/messages";
import {
  createMemoryMediaStore,
  createMemoryWorksStore,
} from "../../src/lib/works/store";

const SITE = "https://samuele.example";
const NOW = 1_800_000_000_000;
const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";

const jpeg = () =>
  new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xda, 0, 2, 1, 2, 0xff, 0xd9,
  ]);

function formWith(overrides: Record<string, string | Blob | null> = {}) {
  const base: Record<string, string | Blob | null> = {
    id: ID,
    category: "2",
    title: "Torta de fresa",
    description: "",
    original: new Blob([jpeg()], { type: "image/jpeg" }),
    sm: new Blob([jpeg()], { type: "image/jpeg" }),
    md: new Blob([jpeg()], { type: "image/jpeg" }),
    lg: new Blob([jpeg()], { type: "image/jpeg" }),
  };
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value === null) continue;
    if (typeof value === "string") form.set(key, value);
    else form.set(key, value, `${key}.jpg`);
  }
  return form;
}

function setup() {
  const worksStore = createMemoryWorksStore();
  const mediaStore = createMemoryMediaStore();
  const post = (body: BodyInit | null, headers: Record<string, string> = {}) =>
    handleCreateWork(
      new Request(`${SITE}/api/admin/works`, { method: "POST", body, headers }),
      { worksStore, mediaStore, now: NOW },
    );
  return { worksStore, mediaStore, post };
}

describe("POST /api/admin/works", () => {
  it("201 con el id y deja el trabajo guardado", async () => {
    const { worksStore, mediaStore, post } = setup();
    const response = await post(formWith());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: ID });
    expect(worksStore.works.get(ID)?.title).toBe("Torta de fresa");
    expect(mediaStore.files.size).toBe(4);
  });

  const cases: Array<
    [string, Record<string, string | Blob | null>, string, string]
  > = [
    ["categoría vacía", { category: "" }, "category", MESSAGES.categoryMissing],
    [
      "sin foto original",
      { original: null },
      "original",
      MESSAGES.photoMissing,
    ],
    ["título vacío", { title: "  " }, "title", MESSAGES.titleMissing],
    ["título largo", { title: "a".repeat(81) }, "title", MESSAGES.titleTooLong],
    [
      "descripción larga",
      { description: "a".repeat(1001) },
      "description",
      MESSAGES.descriptionTooLong,
    ],
    [
      "original que no es imagen",
      { original: new Blob(["hola"], { type: "image/jpeg" }) },
      "original",
      MESSAGES.photoFormat,
    ],
    ["derivada ausente", { lg: null }, "photo", MESSAGES.derivativesInvalid],
    ["id inválido", { id: "no-es-uuid" }, "form", MESSAGES.invalidId],
  ];
  it.each(cases)("422 con %s", async (_name, overrides, field, message) => {
    const { worksStore, mediaStore, post } = setup();
    const response = await post(formWith(overrides));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: { field, message } });
    expect(worksStore.works.size).toBe(0);
    expect(mediaStore.files.size).toBe(0);
  });

  it("400 si el cuerpo no es multipart/form-data", async () => {
    const { post } = setup();
    const response = await post("{}", { "Content-Type": "application/json" });
    expect(response.status).toBe(400);
    expect(
      ((await response.json()) as { error: { field: string } }).error.field,
    ).toBe("form");
  });

  it("413 si Content-Length supera el tope, sin leer el cuerpo", async () => {
    let read = false;
    const request = new Request(`${SITE}/api/admin/works`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data; boundary=x",
        "Content-Length": String(MAX_BODY_BYTES + 1),
      },
    });
    request.formData = async () => {
      read = true;
      return new FormData();
    };
    const response = await handleCreateWork(request, {
      worksStore: createMemoryWorksStore(),
      mediaStore: createMemoryMediaStore(),
      now: NOW,
    });
    expect(response.status).toBe(413);
    expect(read).toBe(false);
  });

  it("503 si falla R2 o D1, sin dejar archivos", async () => {
    const r2 = setup();
    r2.mediaStore.failPutOn = "sm.jpg";
    const a = await r2.post(formWith());
    expect(a.status).toBe(503);
    expect(
      ((await a.json()) as { error: { message: string } }).error.message,
    ).toBe(MESSAGES.saveFailed);
    expect(r2.mediaStore.files.size).toBe(0);

    const d1 = setup();
    d1.worksStore.failInsert = true;
    expect((await d1.post(formWith())).status).toBe(503);
    expect(d1.mediaStore.files.size).toBe(0);
  });

  it("un reintento con el mismo id responde 201 y deja un solo trabajo", async () => {
    const { worksStore, post } = setup();
    expect((await post(formWith())).status).toBe(201);
    expect((await post(formWith())).status).toBe(201);
    expect(worksStore.works.size).toBe(1);
  });
});

describe("protección del middleware sobre las rutas nuevas", () => {
  const authStore = createMemoryStore();
  const guard = (request: Request) =>
    guardRequest({ request, store: authStore, now: NOW, prod: true });

  it("POST sin sesión → 401", async () => {
    const r = await guard(
      new Request(`${SITE}/api/admin/works`, {
        method: "POST",
        headers: { Origin: SITE },
      }),
    );
    expect(r.action).toBe("respond");
    if (r.action === "respond") expect(r.response.status).toBe(401);
  });

  it("POST con Origin ajeno o ausente → 403", async () => {
    const { token } = await createSession(authStore, NOW);
    const cookie = `__Host-session=${token}`;
    for (const headers of <Record<string, string>[]>[
      { Cookie: cookie, Origin: "https://otro.example" },
      { Cookie: cookie },
    ]) {
      const r = await guard(
        new Request(`${SITE}/api/admin/works`, { method: "POST", headers }),
      );
      expect(r.action).toBe("respond");
      if (r.action === "respond") expect(r.response.status).toBe(403);
    }
  });

  it("POST con sesión y Origin propio pasa", async () => {
    const { token } = await createSession(authStore, NOW);
    const r = await guard(
      new Request(`${SITE}/api/admin/works`, {
        method: "POST",
        headers: { Cookie: `__Host-session=${token}`, Origin: SITE },
      }),
    );
    expect(r.action).toBe("pass");
  });

  it("GET /admin/works/new sin sesión redirige (303) a /admin/login", async () => {
    const r = await guard(new Request(`${SITE}/admin/works/new`));
    expect(r.action).toBe("respond");
    if (r.action === "respond") {
      expect(r.response.status).toBe(303);
      expect(r.response.headers.get("Location")).toBe("/admin/login");
    }
  });
});
