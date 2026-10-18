const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Métodos que no modifican datos y no exigen verificación de `Origin`. */
export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

/** `false` si falta `Origin` o no coincide exactamente con el origen del sitio (FR-012). */
export function isSameOrigin(request: Request, siteOrigin: string): boolean {
  const origin = request.headers.get("Origin");
  return origin !== null && origin === siteOrigin;
}
