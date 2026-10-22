/** Límites de la funcionalidad de trabajos (ADR 0005). */
export const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;
export const MAX_DERIVATIVE_BYTES = 1024 * 1024;
export const MAX_TITLE_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const LIST_LIMIT = 200;

/** Anchos de salida de las tres versiones de la foto. */
export const DERIVATIVE_WIDTHS = { sm: 400, md: 900, lg: 1600 } as const;
export const PHOTO_QUALITY = 0.8;
