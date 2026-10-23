import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { handleUpdateWork } from "../../../../lib/works/api";
import {
  createD1WorksStore,
  createR2MediaStore,
} from "../../../../lib/works/store";

export const prerender = false;

// El middleware ya exigió sesión válida y `Origin` propio antes de llegar aquí.
export const PUT: APIRoute = ({ request, params }) =>
  handleUpdateWork(request, params.id ?? "", {
    worksStore: createD1WorksStore(env.DB),
    mediaStore: createR2MediaStore(env.MEDIA),
    log: (message) => console.error(message),
  });

export const ALL: APIRoute = () =>
  new Response(null, {
    status: 405,
    headers: { Allow: "PUT", "Cache-Control": "no-store" },
  });
