import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import NotFound from "../src/pages/404.astro";

describe("página 404", () => {
  it("muestra mensaje amable, logo con alt y enlace al inicio", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(NotFound);
    expect(html).toContain("No encontramos esta página");
    expect(html).toMatch(/<img[^>]*alt="[^"]+"/);
    expect(html).toMatch(/<a[^>]*href="\/"/);
  });
});
