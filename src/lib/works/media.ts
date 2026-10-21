import { MAX_DERIVATIVE_BYTES, MAX_ORIGINAL_BYTES } from "./limits";
import type { ErrorField } from "./messages";
import { MESSAGES } from "./messages";

export type ImageType = "jpeg" | "png" | "webp";

export type Failure = { ok: false; field: ErrorField; message: string };

const startsWith = (bytes: Uint8Array, signature: number[], at = 0) =>
  bytes.length >= at + signature.length &&
  signature.every((byte, i) => bytes[at + i] === byte);

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

/** Tipo de imagen por sus bytes mágicos, no por nombre ni `Content-Type`. */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) {
    return "webp";
  }
  return null;
}

function jpegHasMetadata(bytes: Uint8Array): boolean {
  let i = 2;
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) return false;
    const marker = bytes[i + 1];
    if (marker === 0xff) {
      i += 1; // relleno
      continue;
    }
    if (marker === 0xe1 || marker === 0xed) return true; // APP1 (EXIF/XMP), APP13 (IPTC)
    // Inicio de datos de imagen: los metadatos solo viven en la cabecera.
    if (marker === 0xda || marker === 0xd9) return false;
    // Marcadores sin longitud.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2;
      continue;
    }
    i += 2 + ((bytes[i + 2] << 8) | bytes[i + 3]);
  }
  return false;
}

function webpHasMetadata(bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 12;
  while (i + 8 <= bytes.length) {
    const fourcc = String.fromCharCode(...bytes.subarray(i, i + 4));
    if (fourcc === "EXIF" || fourcc === "XMP ") return true;
    const size = view.getUint32(i + 4, true);
    i += 8 + size + (size % 2);
  }
  return false;
}

/** ¿Lleva EXIF, XMP o IPTC? Solo recorre la cabecera. PNG no se usa en derivadas. */
export function hasMetadata(bytes: Uint8Array, type: ImageType): boolean {
  if (type === "jpeg") return jpegHasMetadata(bytes);
  if (type === "webp") return webpHasMetadata(bytes);
  return false;
}

export type OriginalResult = { ok: true; type: ImageType } | Failure;

export function validateOriginal(
  bytes: Uint8Array | undefined,
): OriginalResult {
  if (!bytes || bytes.length === 0) {
    return { ok: false, field: "original", message: MESSAGES.photoMissing };
  }
  if (bytes.length > MAX_ORIGINAL_BYTES) {
    return { ok: false, field: "original", message: MESSAGES.photoTooLarge };
  }
  const type = sniffImageType(bytes);
  if (!type) {
    return { ok: false, field: "original", message: MESSAGES.photoFormat };
  }
  return { ok: true, type };
}

export type DerivativesResult = { ok: true; ext: "webp" | "jpg" } | Failure;

/** Las tres derivadas: ≤1 MB, WebP o JPEG del mismo tipo entre sí y sin metadatos. */
export function validateDerivatives(files: {
  sm?: Uint8Array;
  md?: Uint8Array;
  lg?: Uint8Array;
}): DerivativesResult {
  const failure: Failure = {
    ok: false,
    field: "photo",
    message: MESSAGES.derivativesInvalid,
  };
  const list = [files.sm, files.md, files.lg];
  let type: ImageType | null = null;
  for (const bytes of list) {
    if (!bytes || bytes.length === 0 || bytes.length > MAX_DERIVATIVE_BYTES) {
      return failure;
    }
    const current = sniffImageType(bytes);
    if (current !== "jpeg" && current !== "webp") return failure;
    if (type !== null && current !== type) return failure;
    if (hasMetadata(bytes, current)) return failure;
    type = current;
  }
  return { ok: true, ext: type === "webp" ? "webp" : "jpg" };
}
