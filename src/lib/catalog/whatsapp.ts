import { SITE } from "../site/contact";

const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

/** Solo los dígitos del número (8–15, formato E.164); `null` si no es válido. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS
    ? digits
    : null;
}

/** Formato legible: `+57 3XX XXX XXXX` para números colombianos; `+` y los dígitos en otro caso. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const colombian = /^57(\d{3})(\d{3})(\d{4})$/.exec(digits);
  return colombian
    ? `+57 ${colombian[1]} ${colombian[2]} ${colombian[3]}`
    : `+${digits}`;
}

/** Enlace `wa.me` con el texto ya escrito; falla de forma visible si el número no es válido. */
export function whatsappUrl(number: string, text: string): string {
  const digits = normalizePhone(number);
  if (!digits) throw new Error(`Número de WhatsApp no válido: "${number}"`);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Frase del trabajo: menciona su título (o su categoría si no tiene). */
export function workMessage(title: string): string {
  return SITE.messages.work.replace("{title}", title);
}

export function generalWhatsappUrl(): string {
  return whatsappUrl(SITE.whatsapp, SITE.messages.general);
}

export function workWhatsappUrl(title: string): string {
  return whatsappUrl(SITE.whatsapp, workMessage(title));
}
