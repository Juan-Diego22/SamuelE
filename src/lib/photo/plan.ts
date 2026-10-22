import { DERIVATIVE_WIDTHS } from "../works/limits";
import type { PhotoExt, PhotoSize } from "../works/keys";

export interface PlannedSize {
  size: PhotoSize;
  width: number;
  height: number;
}

export interface DerivativePlan {
  sizes: PlannedSize[];
  ext: PhotoExt;
}

/** Anchos y formato de salida; puro (sin DOM) para probarlo en Node. Nunca agranda la foto. */
export function planDerivatives(
  width: number,
  height: number,
  supportsWebp: boolean,
): DerivativePlan {
  const sizes = (Object.keys(DERIVATIVE_WIDTHS) as PhotoSize[]).map((size) => {
    const target = Math.min(DERIVATIVE_WIDTHS[size], width);
    return {
      size,
      width: target,
      height: Math.max(1, Math.round((height * target) / width)),
    };
  });
  return { sizes, ext: supportsWebp ? "webp" : "jpg" };
}
