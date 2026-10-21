import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import NewWorkView from "../../src/components/NewWorkView.astro";
import { DEFAULT_CATEGORIES } from "../../src/lib/works/store";
import { MESSAGES } from "../../src/lib/works/messages";

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(NewWorkView, { props });
}

describe("Nuevo trabajo", () => {
  it("muestra título, foto, categorías, campos opcionales y botón", async () => {
    const html = await render({ categories: DEFAULT_CATEGORIES });
    expect(html).toContain("Nuevo trabajo");
    expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).not.toContain("capture");
    for (const name of ["Tortas", "Postres", "Rollos", "Otros"]) {
      expect(html).toContain(`>${name}</option>`);
    }
    expect(html).toContain("Título (opcional)");
    expect(html).toContain("Descripción (opcional)");
    expect(html).toContain("Publicar");
    expect(html).toContain('href="/admin"');
    expect(html).toContain("Necesitas activar JavaScript para publicar fotos.");
    expect(html).toContain('role="alert"');
    expect(html).toContain('maxlength="80"');
    expect(html).toContain('maxlength="1000"');
  });

  it("con falla de base muestra el error y un enlace a /admin", async () => {
    const html = await render({ error: MESSAGES.formUnavailable });
    expect(html).toContain(MESSAGES.formUnavailable);
    expect(html).toContain('href="/admin"');
    expect(html).not.toContain('id="work-form"');
  });
});
