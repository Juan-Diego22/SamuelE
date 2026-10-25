import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import WorksPanel from "../../src/components/WorksPanel.astro";
import type { PanelItem } from "../../src/lib/works/list";
import { MESSAGES } from "../../src/lib/works/messages";

async function render(props: {
  items?: PanelItem[];
  error?: string;
  published?: boolean;
  notice?: "retired" | "updated" | "notAvailable";
}) {
  const container = await AstroContainer.create();
  return container.renderToString(WorksPanel, { props });
}

const item = (over: Partial<PanelItem> = {}): PanelItem => ({
  id: "a",
  title: "Torta de fresa",
  editHref: "/admin/works/a/edit",
  category: "Tortas",
  thumbnailUrl: "/media/works/a-1/sm.webp",
  ...over,
});

describe("Mis trabajos", () => {
  it("lista vacía: mensaje y botón", async () => {
    const html = await render({ items: [] });
    expect(html).toContain("Todavía no tienes trabajos. Publica el primero.");
    expect(html).toContain("+ Nuevo trabajo");
    expect(html).toContain('href="/admin/works/new"');
    expect(html).toContain("Mis trabajos");
  });

  it("una tarjeta por trabajo con imagen y texto alternativo", async () => {
    const html = await render({
      items: [
        item(),
        item({ id: "b", title: "Cupcakes", category: "Postres" }),
      ],
    });
    expect(html.match(/<img[^>]*class="work-thumb"/g)).toHaveLength(2);
    expect(html).toContain('alt="Foto de Torta de fresa"');
    expect(html).toContain("Postres");
  });

  it("cada tarjeta tiene Editar y Retirar con el nombre del trabajo", async () => {
    const html = await render({
      items: [
        item(),
        item({ id: "b", title: "Cupcakes", editHref: "/admin/works/b/edit" }),
      ],
    });
    expect(html).toContain('href="/admin/works/a/edit"');
    expect(html).toContain('href="/admin/works/b/edit"');
    expect(html).toContain('aria-label="Editar Torta de fresa"');
    expect(html).toContain('aria-label="Retirar Cupcakes"');
    expect(html.match(/data-retire(?!-)/g)).toHaveLength(2);
    expect(html).toContain('data-work-id="b"');
  });

  it("un solo diálogo modal con el texto exacto y sus botones", async () => {
    const html = await render({ items: [item(), item({ id: "b" })] });
    expect(html.match(/<dialog/g)).toHaveLength(1);
    expect(html).toContain('aria-labelledby="retire-dialog-title"');
    expect(html).toContain("¿Retirar este trabajo?");
    expect(html).toContain("Dejará de verse en el catálogo público.");
    expect(html).toContain("Cancelar");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>\s*Retirar\s*</);
  });

  it.each([
    ["retired", "Trabajo retirado."],
    ["updated", "Trabajo actualizado."],
    ["notAvailable", "Ese trabajo ya no está disponible."],
  ] as const)("aviso %s con role=status", async (notice, text) => {
    const html = await render({ items: [item()], notice });
    expect(html).toContain(text);
    expect(html).toContain('role="status"');
    for (const other of [
      "Trabajo retirado.",
      "Trabajo actualizado.",
      "Ese trabajo ya no está disponible.",
    ]) {
      if (other !== text) expect(html).not.toContain(other);
    }
  });

  it("al no quedar trabajos aparece el estado vacío", async () => {
    const html = await render({ items: [], notice: "retired" });
    expect(html).toContain("Todavía no tienes trabajos. Publica el primero.");
    expect(html).toContain("Trabajo retirado.");
  });

  it("escapa el texto del usuario", async () => {
    const html = await render({
      items: [item({ title: "<script>alert(1)</script>" })],
    });
    expect(html).toContain(
      '<p class="work-title">&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
  });

  it("?publicado=1 muestra el aviso con role=status", async () => {
    const html = await render({ items: [], published: true });
    expect(html).toContain("Trabajo publicado.");
    expect(html).toContain('role="status"');
    expect(await render({ items: [] })).not.toContain("Trabajo publicado.");
  });

  it("si falla la base muestra el error y conserva el botón", async () => {
    const html = await render({ error: MESSAGES.listFailed });
    expect(html).toContain(
      "No pudimos cargar tus trabajos. Intenta de nuevo en unos minutos.",
    );
    expect(html).toContain("+ Nuevo trabajo");
    expect(html).not.toContain("Todavía no tienes trabajos");
  });
});
