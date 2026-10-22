import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { handleCreateWork } from "../../../lib/works/api";
import {
  createD1WorksStore,
  createR2MediaStore,
} from "../../../lib/works/store";

export const prerender = false;

// El middleware ya exigió sesión válida y `Origin` propio antes de llegar aquí.
export const POST: APIRoute = ({ request }) =>
  handleCreateWork(request, {
    worksStore: createD1WorksStore(env.DB),
    mediaStore: createR2MediaStore(env.MEDIA),
    now: Date.now(),
    log: (message) => console.error(message),
  });
