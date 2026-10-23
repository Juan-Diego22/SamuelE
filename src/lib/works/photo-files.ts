import { derivativeKey, originalKey } from "./keys";
import type { PhotoExt, PhotoSize } from "./keys";
import type { ImageType } from "./media";

const ORIGINAL_TYPES = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

/** `[clave, bytes, Content-Type]` de la original y las tres derivadas de una versión de la foto. */
export function photoFiles(args: {
  id: string;
  version: number;
  ext: PhotoExt;
  original: Uint8Array;
  originalType: ImageType;
  derivatives: { sm?: Uint8Array; md?: Uint8Array; lg?: Uint8Array };
}): Array<[string, Uint8Array, string]> {
  const { id, version, ext, derivatives } = args;
  const contentType = ext === "webp" ? "image/webp" : "image/jpeg";
  return [
    [
      originalKey(id, version),
      args.original,
      ORIGINAL_TYPES[args.originalType],
    ],
    ...(["sm", "md", "lg"] as PhotoSize[]).map(
      (size): [string, Uint8Array, string] => [
        derivativeKey(id, version, size, ext),
        derivatives[size] as Uint8Array,
        contentType,
      ],
    ),
  ];
}

/** Las cuatro claves de R2 de una versión de la foto. */
export function photoKeys(id: string, version: number, ext: PhotoExt) {
  return [
    originalKey(id, version),
    ...(["sm", "md", "lg"] as PhotoSize[]).map((size) =>
      derivativeKey(id, version, size, ext),
    ),
  ];
}
