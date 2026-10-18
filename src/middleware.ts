import { env } from "cloudflare:workers";
import { defineMiddleware } from "astro:middleware";
import { guardRequest } from "./lib/auth/guard";
import { createD1Store } from "./lib/auth/store";

// Protege /admin/* y /api/admin/*; la lógica vive en lib/auth/guard.ts (probada en Node).
export const onRequest = defineMiddleware(async (context, next) => {
  const result = await guardRequest({
    request: context.request,
    store: createD1Store(env.DB),
    now: Date.now(),
    prod: import.meta.env.PROD,
  });

  if (result.action === "respond") return result.response;

  if (result.session) context.locals.session = result.session;
  const response = await next();
  if (result.noStore) response.headers.set("Cache-Control", "no-store");
  return response;
});
