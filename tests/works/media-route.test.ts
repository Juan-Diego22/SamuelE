import { describe, expect, it } from "vitest";
import { serveMedia } from "../../src/lib/works/serve-media";
import { createMemoryMediaStore } from "../../src/lib/works/store";

const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";

async function setup() {
  const store = createMemoryMediaStore();
  await store.put(
    `works/${ID}-1/sm.webp`,
    new Uint8Array([1, 2, 3]),
    "image/webp",
  );
  await store.put(`works/${ID}-1/sm.jpg`, new Uint8Array([4]), "image/jpeg");
  await store.put(`originals/${ID}-1.jpg`, new Uint8Array([9]), "image/jpeg");
  let gets = 0;
  const original = store.get;
  store.get = async (key) => {
    gets++;
    return original(key);
  };
  return { store, gets: () => gets };
}

describe("GET /media", () => {
  it("sirve una derivada con tipo y caché inmutable", async () => {
    const { store } = await setup();
    const webp = await serveMedia("GET", `works/${ID}-1/sm.webp`, store);
    expect(webp.status).toBe(200);
    expect(webp.headers.get("Content-Type")).toBe("image/webp");
    expect(webp.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(new Uint8Array(await webp.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    const jpg = await serveMedia("GET", `works/${ID}-1/sm.jpg`, store);
    expect(jpg.headers.get("Content-Type")).toBe("image/jpeg");
  });

  it("HEAD responde 200 sin cuerpo", async () => {
    const { store } = await setup();
    const r = await serveMedia("HEAD", `works/${ID}-1/sm.webp`, store);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("");
  });

  it("una ruta inexistente es 404", async () => {
    const { store } = await setup();
    expect(
      (await serveMedia("GET", `works/${ID}-1/lg.webp`, store)).status,
    ).toBe(404);
  });

  it("originals/ y rutas ajenas son 404 sin consultar R2", async () => {
    const { store, gets } = await setup();
    for (const path of [
      `originals/${ID}-1.jpg`,
      `works/${ID}-1/xl.webp`,
      `works/${ID}-1/sm.png`,
      `works/${ID}-1/../../originals/${ID}-1.jpg`,
      `works/no-es-uuid-1/sm.webp`,
      "",
      undefined,
    ]) {
      expect((await serveMedia("GET", path, store)).status).toBe(404);
    }
    expect(gets()).toBe(0);
  });

  it("otros métodos son 405", async () => {
    const { store } = await setup();
    for (const method of ["POST", "PUT", "DELETE"]) {
      expect(
        (await serveMedia(method, `works/${ID}-1/sm.webp`, store)).status,
      ).toBe(405);
    }
  });

  it("si falla R2 responde 502 sin caché", async () => {
    const { store } = await setup();
    store.failGet = true;
    const r = await serveMedia("GET", `works/${ID}-1/sm.webp`, store);
    expect(r.status).toBe(502);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
  });
});
