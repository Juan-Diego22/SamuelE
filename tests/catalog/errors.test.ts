import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, it, vi } from "vitest";
import CatalogView from "../../src/components/CatalogView.astro";
import DetailView from "../../src/components/DetailView.astro";
import { loadCatalog } from "../../src/lib/catalog/load";
import { createMemoryWorksStore } from "../../src/lib/works/store";

afterEach(() => vi.restoreAllMocks());

describe("errores amables", () => {
  it("fallo de D1: mensaje sencillo, reintento, cabecera y pie", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createMemoryWorksStore();
    store.failList = true;
    const data = await loadCatalog(store, { categoria: "tortas" });
    expect(data.state).toBe("error");

    const container = await AstroContainer.create();
    const html = await container.renderToString(CatalogView, {
      props: { data, retryHref: "/?categoria=tortas" },
    });
    expect(html).toContain(
      "No pudimos cargar los trabajos. Intenta de nuevo en un momento.",
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('href="/?categoria=tortas"');
    expect(html).toContain("Reintentar");
    expect(html).toContain("Samuelé Repostería");
    expect(html).toContain("CONTACTO");
    expect(html).not.toMatch(/D1|forzado|stack|TypeError/i);
  });

  it("detalle: error y no disponible son mensajes distintos", async () => {
    const container = await AstroContainer.create();
    const failed = await container.renderToString(DetailView, {
      props: { data: { state: "error" }, retryHref: "/trabajos/x" },
    });
    const missing = await container.renderToString(DetailView, {
      props: { data: { state: "notFound" } },
    });
    expect(failed).toContain("Reintentar");
    expect(failed).toContain("Ver el catálogo");
    expect(missing).toContain("Este trabajo ya no está disponible.");
    expect(failed).not.toContain("ya no está disponible");
    expect(missing).not.toContain("No pudimos cargar");
  });
});
