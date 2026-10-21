import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import WorksPanel from "../../src/components/WorksPanel.astro";
import type { PanelItem } from "../../src/lib/works/list";
import { MESSAGES } from "../../src/lib/works/messages";

async function render(props: {
  items?: PanelItem[];
  error?: string;
  published?: boolean;
}) {
  const container = await AstroContainer.create();
  return container.renderToString(WorksPanel, { props });
}

const item = (over: Partial<PanelItem> = {}): PanelItem => ({
  id: "a",
  title: "Torta de fresa",
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
    expect(html).not.toContain("Editar");
    expect(html).not.toContain("Retirar");
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
