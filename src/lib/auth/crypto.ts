// Primitivas de criptografía con Web Crypto; sin dependencias externas (ADR 0006).

const encoder = new TextEncoder();

/** SHA-256 de un texto, como bytes. */
export async function sha256Bytes(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return new Uint8Array(digest);
}

/** SHA-256 de un texto, en hexadecimal (64 caracteres). */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = await sha256Bytes(input);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Token aleatorio de 32 bytes (256 bits) en base64url, sin relleno. */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Compara dos resúmenes sin cortocircuito. Los resúmenes SHA-256 tienen la misma
 * longitud, requisito de `timingSafeEqual`; si no la tienen, se rechaza.
 */
export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (x: Uint8Array, y: Uint8Array) => boolean;
  };
  if (typeof subtle.timingSafeEqual === "function") {
    return subtle.timingSafeEqual(a, b);
  }
  // Respaldo (Node en pruebas): acumula diferencias sin salir antes de tiempo.
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
