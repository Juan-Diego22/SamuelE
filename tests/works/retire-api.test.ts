import { describe, expect, it } from "vitest";
import { handleRetireWork } from "../../src/lib/works/api";
import { MESSAGES } from "../../src/lib/works/messages";
import { createMemoryWorksStore } from "../../src/lib/works/store";

const SITE = "https://samuele.example";
const NOW = 1_800_000_000_000;
const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";

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
  const post = (id: string, json: boolean) =>
    handleRetireWork(
      new Request(`${SITE}/api/admin/works/${id}/retire`, {
        method: "POST",
        headers: json ? { Accept: "application/json" } : {},
      }),
      id,
      { worksStore, now: NOW },
    );
  return { worksStore, post };
}

describe("POST /api/admin/works/{id}/retire", () => {
  it("JSON: 200 con el id y no-store", async () => {
    const { worksStore, post } = await setup();
    const response = await post(ID, true);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: ID });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await worksStore.listWorks(10)).toEqual([]);
  });

  it("JSON: 404 si no está disponible (inexistente, retirado o id inválido)", async () => {
    const { post } = await setup();
    await post(ID, true);
    for (const id of [ID, "abc"]) {
      const response = await post(id, true);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: { field: "form", message: MESSAGES.notAvailable },
      });
    }
  });

  it("JSON: 503 si falla D1", async () => {
    const { worksStore, post } = await setup();
    worksStore.failRetire = true;
    const response = await post(ID, true);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: { field: "form", message: MESSAGES.retireFailed },
    });
  });

  it("formulario HTML: 303 según el resultado", async () => {
    const { worksStore, post } = await setup();
    let response = await post(ID, false);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/admin?retirado=1");
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    response = await post(ID, false);
    expect(response.headers.get("Location")).toBe("/admin?noDisponible=1");

    await worksStore.insertWork({
      id: "11111111-1111-4111-8111-111111111111",
      categoryId: 1,
      title: "Otra",
      description: null,
      photoVersion: 1,
      photoExt: "webp",
      createdAt: 2000,
    });
    worksStore.failRetire = true;
    response = await post("11111111-1111-4111-8111-111111111111", false);
    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/admin");
  });
});
