import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import EditWorkView from "../../src/components/EditWorkView.astro";
import { toEditValues } from "../../src/lib/works/edit-view";
import { MESSAGES } from "../../src/lib/works/messages";
import { DEFAULT_CATEGORIES } from "../../src/lib/works/store";
import type { ListedWork } from "../../src/lib/works/store";

const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";
const listed = (over: Partial<ListedWork> = {}): ListedWork => ({
  id: ID,
  categoryId: 2,
  categoryName: "Postres",
  title: "Cupcakes",
  description: "Con crema",
  photoVersion: 3,
  photoExt: "webp",
  createdAt: 1000,
  ...over,
});

async function render(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(EditWorkView, { props });
}

describe("toEditValues", () => {
  it("arma los valores y la URL md con su versión", () => {
    expect(toEditValues(listed())).toEqual({
      id: ID,
      categoryId: 2,
      title: "Cupcakes",
      description: "Con crema",
      photoVersion: 3,
      photoUrl: `/media/works/${ID}-3/md.webp`,
    });
  });

  it("una fila antigua sin título o descripción queda con cadenas vacías", () => {
    expect(
      toEditValues(listed({ title: null, description: null })),
    ).toMatchObject({ title: "", description: "" });
  });
});

describe("Editar trabajo", () => {
  const props = () => ({
    categories: DEFAULT_CATEGORIES,
    work: toEditValues(listed()),
  });

  it("precarga el formulario con la foto actual y el botón Guardar", async () => {
    const html = await render(props());
    expect(html).toContain("Editar trabajo");
    expect(html).toContain(`data-work-id="${ID}"`);
    expect(html).toContain('data-photo-version="3"');
    expect(html).toContain(`src="/media/works/${ID}-3/md.webp"`);
    expect(html).toMatch(/<option value="2" selected[^>]*>\s*Postres/);
    expect(html).toContain('value="Cupcakes"');
    expect(html).toContain("Con crema");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>\s*Guardar\s*</);
    expect(html).not.toContain("Publicar");
    expect(html).toContain('href="/admin"');
  });

  it("no exige foto nueva: el input no es required", async () => {
    const html = await render(props());
    expect(html).not.toMatch(/<input[^>]*id="photo"[^>]*required/);
  });

  it("trabajo no disponible: mensaje y vuelta a Mis trabajos", async () => {
    const html = await render({ error: MESSAGES.notAvailable });
    expect(html).toContain("Ese trabajo ya no está disponible.");
    expect(html).toContain("Volver a Mis trabajos");
    expect(html).not.toContain('id="work-form"');
  });

  it("falla de base: mensaje sencillo y enlace a /admin", async () => {
    const html = await render({ error: MESSAGES.formUnavailable });
    expect(html).toContain(MESSAGES.formUnavailable);
    expect(html).toContain('href="/admin"');
  });

  it("escapa el texto del usuario (atributo y textarea)", async () => {
    const html = await render({
      categories: DEFAULT_CATEGORIES,
      work: toEditValues(
        listed({
          title: 'x" autofocus onfocus="alert(1)',
          description: "</textarea><script>alert(1)</script>",
        }),
      ),
    });
    expect(html).not.toContain('value="x" autofocus');
    expect(html).toContain("&quot;");
    expect(html).not.toContain("</textarea><script>alert(1)");
    expect(html).toContain("&lt;/textarea&gt;&lt;script&gt;");
  });

  describe("zona de foto, placeholders y asteriscos (US3)", () => {
    it("muestra la foto actual con 'Cambiar foto' y los textos de ayuda", async () => {
      const html = await render(props());
      expect(html).toMatch(/<label[^>]*class="[^"]*photo-drop[^"]*has-photo/);
      expect(html).toContain("Cambiar foto");
      expect(html).toContain('placeholder="Ej: Torta de Chocolate"');
      expect(html).toContain(
        'placeholder="Describe los ingredientes, tamaño, etc."',
      );
      expect(html).toContain("Selecciona una categoría");
      expect(html).toContain("Descripción (opcional)");
    });
  });
});
