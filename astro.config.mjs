// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// Sin KV ni Images: el esqueleto no tiene sesiones ni almacenamiento (D8, FR-014).
// Vitest renderiza los componentes sin el adaptador, que choca con su servidor de Vite (R1).
export default defineConfig({
  adapter: process.env.VITEST
    ? undefined
    : cloudflare({ imageService: "compile" }),
  session: false,
});
