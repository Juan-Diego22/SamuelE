import { sha256Bytes, timingSafeEqualBytes } from "./crypto";

export interface AdminSecrets {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

/** Ignora mayúsculas y espacios sobrantes del correo (la contraseña no se normaliza). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Compara contra la credencial configurada. Siempre evalúa las dos parejas, sin
 * cortocircuito, para que "correo mal" y "contraseña mal" tarden lo mismo (FR-003).
 * Falla cerrada si falta cualquier secreto.
 */
export async function verifyCredentials(
  secrets: AdminSecrets,
  email: string,
  password: string,
): Promise<boolean> {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = secrets;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return false;

  const [emailIn, emailRef, passIn, passRef] = await Promise.all([
    sha256Bytes(normalizeEmail(email)),
    sha256Bytes(normalizeEmail(ADMIN_EMAIL)),
    sha256Bytes(password),
    sha256Bytes(ADMIN_PASSWORD),
  ]);
  const emailOk = timingSafeEqualBytes(emailIn, emailRef);
  const passOk = timingSafeEqualBytes(passIn, passRef);
  return emailOk && passOk;
}
