import { cookieName } from "./cookie";
import { isSafeMethod, isSameOrigin } from "./origin";
import { validateSession } from "./sessions";
import type { AuthStore } from "./store";

export interface GuardInput {
  request: Request;
  store: AuthStore;
  now: number;
  prod: boolean;
}

export type GuardResult =
  | { action: "pass"; session?: { id: string }; noStore: boolean }
  | { action: "respond"; response: Response };

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("Cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

function isAdminApiPath(path: string): boolean {
  return path === "/api/admin" || path.startsWith("/api/admin/");
}

function noStore(response: Response): Response {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function redirect(location: string): GuardResult {
  return {
    action: "respond",
    response: noStore(
      new Response(null, { status: 303, headers: { Location: location } }),
    ),
  };
}

/** Reglas del middleware, en el orden de `contracts/http-routes.md`. */
export async function guardRequest(input: GuardInput): Promise<GuardResult> {
  const { request, store, now, prod } = input;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  // 1. Sitio público intacto
  if (!isAdminPath(path) && !isAdminApiPath(path)) {
    return { action: "pass", noStore: false };
  }

  // 2. Peticiones que modifican datos: solo desde el propio sitio
  if (!isSafeMethod(request.method) && !isSameOrigin(request, url.origin)) {
    return {
      action: "respond",
      response: noStore(new Response("Forbidden", { status: 403 })),
    };
  }

  const session = await validateSession(
    store,
    readCookie(request, cookieName(prod)),
    now,
  );

  // 3. Pantalla de inicio de sesión
  if (path === "/admin/login") {
    if (session && request.method === "GET") return redirect("/admin");
    return { action: "pass", session: session ?? undefined, noStore: true };
  }

  // 4 y 5. Sin sesión
  if (!session) {
    if (isAdminApiPath(path)) {
      return {
        action: "respond",
        response: noStore(
          new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      };
    }
    return redirect("/admin/login");
  }

  // 6. Con sesión
  return { action: "pass", session, noStore: true };
}
