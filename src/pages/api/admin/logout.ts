import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { cookieName, expiredCookie } from "../../../lib/auth/cookie";
import { readCookie } from "../../../lib/auth/guard";
import { deleteSession } from "../../../lib/auth/sessions";
import { createD1Store } from "../../../lib/auth/store";

export const prerender = false;

// El middleware ya exigió sesión válida y `Origin` propio antes de llegar aquí.
export const POST: APIRoute = async ({ request }) => {
  const prod = import.meta.env.PROD;
  const token = readCookie(request, cookieName(prod));
  if (token) await deleteSession(createD1Store(env.DB), token);
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin/login",
      "Set-Cookie": expiredCookie(prod),
      "Cache-Control": "no-store",
    },
  });
};
