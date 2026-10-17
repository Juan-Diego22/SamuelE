import type { APIRoute } from "astro";

// Comodín: hace que el middleware proteja también rutas inexistentes bajo /api/admin (R1).
export const prerender = false;

export const ALL: APIRoute = () => new Response(null, { status: 404 });
