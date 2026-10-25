import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { handleRetireWork } from "../../../../../lib/works/api";
import { createD1WorksStore } from "../../../../../lib/works/store";

export const prerender = false;

// El middleware ya exigió sesión válida y `Origin` propio antes de llegar aquí.
export const POST: APIRoute = ({ request, params }) =>
  handleRetireWork(request, params.id ?? "", {
    worksStore: createD1WorksStore(env.DB),
    now: Date.now(),
    log: (message) => console.error(message),
  });

export const ALL: APIRoute = () =>
  new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
