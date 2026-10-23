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
  it("muestra título, foto, categorías, descripción opcional y botón", async () => {
    const html = await render({ categories: DEFAULT_CATEGORIES });
    expect(html).toContain("Nuevo trabajo");
    expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).not.toContain("capture");
    for (const name of ["Tortas", "Postres", "Rollos", "Otros"]) {
      expect(html).toContain(`>${name}</option>`);
    }
    expect(html).not.toContain("Título (opcional)");
    expect(html).toContain("Descripción (opcional)");
    expect(html).toContain("Publicar");
    expect(html).toContain('href="/admin"');
    expect(html).toContain("Necesitas activar JavaScript para publicar fotos.");
    expect(html).toContain('role="alert"');
    expect(html).toContain('maxlength="80"');
    expect(html).toContain('maxlength="1000"');
  });

  it("zona de foto: un label con el input, ícono, textos y sin capture", async () => {
    const html = await render({ categories: DEFAULT_CATEGORIES });
    expect(html).toMatch(
      /<label[^>]*for="photo"[^>]*class="[^"]*photo-drop[^"]*"[\s\S]*?<input[^>]*id="photo"[^>]*type="file"[\s\S]*?<\/label>/,
    );
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toContain("Toca para subir foto");
    expect(html).toContain("Galería o cámara");
    expect(html).toContain("Cambiar foto");
    expect(html).not.toMatch(/<label[^>]*photo-drop[^>]*has-photo/);
  });

  it("placeholders y primera opción del selector", async () => {
    const html = await render({ categories: DEFAULT_CATEGORIES });
    expect(html).toContain('placeholder="Ej: Torta de Chocolate"');
    expect(html).toContain(
      'placeholder="Describe los ingredientes, tamaño, etc."',
    );
    expect(html).toMatch(
      /<option value="">Selecciona una categoría<\/option>\s*<option value="1"[^>]*>\s*Tortas[\s\S]*Postres[\s\S]*Rollos[\s\S]*Otros/,
    );
  });

  it("asteriscos en Foto, Categoría y Título; no en Descripción", async () => {
    const html = await render({ categories: DEFAULT_CATEGORIES });
    const label = (id: string) =>
      html.match(new RegExp(`<label for="${id}">[\\s\\S]*?</label>`))![0];
    for (const id of ["photo", "category", "title"]) {
      expect(label(id)).toContain('<span class="required" aria-hidden="true"');
      expect(label(id)).toContain("(obligatorio)");
    }
    expect(label("description")).not.toContain("required");
    expect(label("description")).toContain("Descripción (opcional)");
    expect(html.match(/class="required"/g)).toHaveLength(3);
  });

  it("cada etiqueta sigue asociada a su campo y se conservan los errores", async () => {
    const html = await render({ categories: DEFAULT_CATEGORIES });
    for (const id of ["photo", "category", "title", "description"]) {
      expect(html).toContain(`<label for="${id}"`);
      expect(html).toMatch(
        new RegExp(`<(input|select|textarea)[^>]*id="${id}"`),
      );
      expect(html).toContain(`id="error-${id}"`);
    }
    expect(html).toContain('data-mode="new"');
  });

  it("con falla de base muestra el error y un enlace a /admin", async () => {
    const html = await render({ error: MESSAGES.formUnavailable });
    expect(html).toContain(MESSAGES.formUnavailable);
    expect(html).toContain('href="/admin"');
    expect(html).not.toContain('id="work-form"');
  });
});
