import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { serveMedia } from "../../lib/works/serve-media";
import { createR2MediaStore } from "../../lib/works/store";

export const prerender = false;

// Pública y fuera de /admin: las miniaturas deben verse sin sesión (ADR 0004).
export const ALL: APIRoute = ({ request, params }) =>
  serveMedia(request.method, params.path, createR2MediaStore(env.MEDIA));
