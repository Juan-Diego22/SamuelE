export type PhotoSize = "sm" | "md" | "lg";
export type PhotoExt = "webp" | "jpg";

/** Clave R2 de la foto original (privada, sin endpoint). */
export function originalKey(id: string, version: number): string {
  return `originals/${id}-${version}.jpg`;
}

/** Clave R2 de una derivada pública. */
export function derivativeKey(
  id: string,
  version: number,
  size: PhotoSize,
  ext: PhotoExt,
): string {
  return `works/${id}-${version}/${size}.${ext}`;
}

/** URL pública de una derivada, servida por `/media`. */
export function mediaUrl(
  id: string,
  version: number,
  size: PhotoSize,
  ext: PhotoExt,
): string {
  return `/media/${derivativeKey(id, version, size, ext)}`;
}
