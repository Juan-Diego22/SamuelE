import { afterEach, describe, expect, it, vi } from "vitest";
import { loadDetail, toDetailView } from "../../src/lib/catalog/detail";
import { normalizePhone } from "../../src/lib/catalog/whatsapp";
import { SITE } from "../../src/lib/site/contact";
import { createMemoryWorksStore } from "../../src/lib/works/store";
import type { ListedWork, NewWork } from "../../src/lib/works/store";

const ID = "11111111-1111-4111-8111-111111111111";

const row = (over: Partial<ListedWork> = {}): ListedWork => ({
  id: ID,
  categoryId: 1,
  categoryName: "Tortas",
  title: "Torta de Chocolate",
  description: "Con ganache",
  photoVersion: 3,
  photoExt: "webp",
  createdAt: 5,
  retiredAt: null,
  ...over,
});

const newWork = (over: Partial<NewWork> = {}): NewWork => ({
  id: ID,
  categoryId: 1,
  title: "Torta",
  description: null,
  photoVersion: 1,
  photoExt: "webp",
  createdAt: 1,
  ...over,
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("../../src/lib/site/contact");
});

describe("toDetailView", () => {
  it("arma título, categoría, fotos md y lg, alt y WhatsApp", () => {
    const view = toDetailView(row());
    expect(view).toMatchObject({
      title: "Torta de Chocolate",
      category: "Tortas",
      description: "Con ganache",
      photoMd: `/media/works/${ID}-3/md.webp`,
      photoLg: `/media/works/${ID}-3/lg.webp`,
      alt: "Torta de Chocolate — Tortas",
    });
    expect(view.whatsappUrl).toBe(
      `https://wa.me/${normalizePhone(SITE.whatsapp)}?text=${encodeURIComponent('Hola Samuelé, me interesa el trabajo "Torta de Chocolate". ¿Me puedes dar más información?')}`,
    );
  });

  it("sin título usa la categoría; sin descripción la omite", () => {
    const view = toDetailView(row({ title: null, description: "  " }));
    expect(view.title).toBe("Tortas");
    expect(view.description).toBeUndefined();
    expect(decodeURIComponent(view.whatsappUrl.split("?text=")[1])).toContain(
      '"Tortas"',
    );
  });

  it("codifica comillas, & y emojis del título", () => {
    const view = toDetailView(row({ title: 'Torta "Mamá" & 🎂' }));
    const text = decodeURIComponent(view.whatsappUrl.split("?text=")[1]);
    expect(text).toContain('Torta "Mamá" & 🎂');
    expect(view.whatsappUrl.split("?text=")[1]).not.toMatch(/[ "&]/);
  });

  it("no expone campos internos", () => {
    const view = toDetailView(row({ retiredAt: 9 }));
    expect(JSON.stringify(view)).not.toMatch(/retired|photoVersion/i);
  });

  it("cambiar el número de contacto cambia el enlace sin tocar nada más (FR-020)", async () => {
    vi.resetModules();
    vi.doMock("../../src/lib/site/contact", async (original) => {
      const mod = await original<typeof import("../../src/lib/site/contact")>();
      return { SITE: { ...mod.SITE, whatsapp: "+1 415 555 0123" } };
    });
    const { toDetailView: fresh } =
      await import("../../src/lib/catalog/detail");
    expect(
      fresh(row()).whatsappUrl.startsWith("https://wa.me/14155550123?"),
    ).toBe(true);
  });
});

describe("loadDetail", () => {
  it("trabajo activo: found", async () => {
    const store = createMemoryWorksStore();
    await store.insertWork(newWork());
    const data = await loadDetail(store, ID);
    expect(data.state).toBe("found");
  });

  it("retirado, inexistente o id inválido: notFound", async () => {
    const store = createMemoryWorksStore();
    await store.insertWork(newWork({ retiredAt: 9 }));
    expect((await loadDetail(store, ID)).state).toBe("notFound");
    expect(
      (await loadDetail(store, "22222222-2222-4222-8222-222222222222")).state,
    ).toBe("notFound");
    expect((await loadDetail(store, "no-es-uuid")).state).toBe("notFound");
    expect((await loadDetail(store, undefined)).state).toBe("notFound");
  });

  it("un id inválido no consulta el almacén", async () => {
    const store = createMemoryWorksStore();
    const spy = vi.spyOn(store, "getWork");
    await loadDetail(store, "../../etc");
    expect(spy).not.toHaveBeenCalled();
  });

  it("un fallo de D1 es error, no notFound", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createMemoryWorksStore();
    store.getWork = async () => {
      throw new Error("fallo");
    };
    expect((await loadDetail(store, ID)).state).toBe("error");
    expect(console.error).toHaveBeenCalled();
  });
});
