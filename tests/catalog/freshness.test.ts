import { describe, expect, it } from "vitest";
import { loadCatalog } from "../../src/lib/catalog/load";
import { loadDetail } from "../../src/lib/catalog/detail";
import { createWork } from "../../src/lib/works/create";
import { retireWork } from "../../src/lib/works/retire";
import {
  createMemoryMediaStore,
  createMemoryWorksStore,
} from "../../src/lib/works/store";
import { updateWork } from "../../src/lib/works/update";

const A = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";
const B = "4a3c9d2f-8b5e-4f1c-8d66-1b2c3d4e5f60";

const jpeg = (n: number) =>
  new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0,
    4,
    0,
    0,
    0xff,
    0xda,
    0,
    2,
    n,
    2,
    0xff,
    0xd9,
  ]);
const photo = (n = 1) => ({
  original: jpeg(n),
  derivatives: { sm: jpeg(n), md: jpeg(n), lg: jpeg(n) },
});

function setup() {
  return {
    worksStore: createMemoryWorksStore(),
    mediaStore: createMemoryMediaStore(),
  };
}

async function publish(
  s: ReturnType<typeof setup>,
  id: string,
  title: string,
  category: string,
  now: number,
) {
  const result = await createWork({
    ...s,
    fields: { id, category, title, description: "" },
    ...photo(),
    now,
  });
  expect(result.status).toBe("created");
}

describe("el catálogo refleja los cambios del panel (historia 4)", () => {
  it("publicar: el trabajo aparece primero", async () => {
    const s = setup();
    await publish(s, A, "Primera", "1", 1000);
    await publish(s, B, "Segunda", "1", 2000);
    const data = await loadCatalog(s.worksStore, {});
    expect(data.cards.map((c) => c.title)).toEqual(["Segunda", "Primera"]);
  });

  it("editar título, categoría y descripción: catálogo y detalle los muestran", async () => {
    const s = setup();
    await publish(s, A, "Antes", "1", 1000);
    const result = await updateWork({
      ...s,
      id: A,
      baseVersion: undefined,
      fields: { category: "2", title: "Después", description: "Nueva" },
      original: undefined,
      derivatives: {},
    });
    expect(result.status).toBe("updated");

    const postres = await loadCatalog(s.worksStore, { categoria: "postres" });
    expect(postres.cards.map((c) => c.title)).toEqual(["Después"]);
    const tortas = await loadCatalog(s.worksStore, { categoria: "tortas" });
    expect(tortas.state).toBe("emptyCategory");

    const detail = await loadDetail(s.worksStore, A);
    expect(detail.state).toBe("found");
    if (detail.state === "found") {
      expect(detail.view.title).toBe("Después");
      expect(detail.view.category).toBe("Postres");
      expect(detail.view.description).toBe("Nueva");
    }
  });

  it("editar no cambia su lugar en la lista", async () => {
    const s = setup();
    await publish(s, A, "Vieja", "1", 1000);
    await publish(s, B, "Nueva", "1", 2000);
    await updateWork({
      ...s,
      id: A,
      baseVersion: undefined,
      fields: { category: "1", title: "Vieja editada", description: "" },
      original: undefined,
      derivatives: {},
    });
    const data = await loadCatalog(s.worksStore, {});
    expect(data.cards.map((c) => c.id)).toEqual([B, A]);
  });

  it("reemplazar la foto: ninguna vista pública muestra la anterior (FR-025)", async () => {
    const s = setup();
    await publish(s, A, "Torta", "1", 1000);
    const before = await loadCatalog(s.worksStore, {});
    const result = await updateWork({
      ...s,
      id: A,
      baseVersion: 1,
      fields: { category: "1", title: "Torta", description: "" },
      ...photo(7),
    });
    expect(result.status).toBe("updated");

    const after = await loadCatalog(s.worksStore, {});
    expect(after.cards[0].photoUrl).not.toBe(before.cards[0].photoUrl);
    expect(after.cards[0].photoUrl).toContain(`${A}-2/`);
    const detail = await loadDetail(s.worksStore, A);
    if (detail.state !== "found") throw new Error("debía existir");
    expect(detail.view.photoMd).toContain(`${A}-2/`);
    expect(detail.view.photoLg).toContain(`${A}-2/`);
    expect(JSON.stringify([after, detail])).not.toContain(`${A}-1/`);
  });

  it("retirar: desaparece del catálogo y su detalle es notFound (FR-026)", async () => {
    const s = setup();
    await publish(s, A, "Torta", "1", 1000);
    await publish(s, B, "Otra", "1", 2000);
    const result = await retireWork({
      worksStore: s.worksStore,
      id: A,
      now: 3000,
    });
    expect(result.status).toBe("retired");

    const data = await loadCatalog(s.worksStore, {});
    expect(data.cards.map((c) => c.id)).toEqual([B]);
    expect((await loadDetail(s.worksStore, A)).state).toBe("notFound");
    expect((await loadDetail(s.worksStore, B)).state).toBe("found");
  });
});
