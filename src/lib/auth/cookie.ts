import { SESSION_TTL_MS } from "./sessions";

/** En producción `__Host-` obliga a Secure, Path=/ y sin Domain; en `astro dev` (http) se usa `session`. */
export function cookieName(prod: boolean): string {
  return prod ? "__Host-session" : "session";
}

export function sessionCookie(token: string, prod: boolean): string {
  return [
    `${cookieName(prod)}=${token}`,
    "HttpOnly",
    ...(prod ? ["Secure"] : []),
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SESSION_TTL_MS / 1000}`,
  ].join("; ");
}

export function expiredCookie(prod: boolean): string {
  return [
    `${cookieName(prod)}=`,
    "HttpOnly",
    ...(prod ? ["Secure"] : []),
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ].join("; ");
}
