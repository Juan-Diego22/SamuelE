import { derivativeKey, originalKey } from "./keys";
import type { PhotoSize } from "./keys";
import { validateDerivatives, validateOriginal } from "./media";
import type { ErrorField } from "./messages";
import type { MediaStore, WorksStore } from "./store";
import { validateFields } from "./validate";
import type { RawFields } from "./validate";

const PHOTO_VERSION = 1;

export interface CreateWorkInput {
  worksStore: WorksStore;
  mediaStore: MediaStore;
  fields: RawFields;
  original: Uint8Array | undefined;
  derivatives: { sm?: Uint8Array; md?: Uint8Array; lg?: Uint8Array };
  now: number;
  /** Para registrar fallos de limpieza; por defecto no hace nada. */
  log?: (message: string) => void;
}

export type CreateWorkResult =
  | { status: "created"; id: string }
  | { status: "invalid"; field: ErrorField; message: string }
  | { status: "unavailable" };

const ORIGINAL_TYPES = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

/**
 * Valida, escribe en R2 (original y derivadas) y al final en D1; si algo falla, deshace R2.
 * Un trabajo existe en D1 solo si sus cuatro archivos ya están en R2 (research D5).
 */
export async function createWork(
  input: CreateWorkInput,
): Promise<CreateWorkResult> {
  const { worksStore, mediaStore, fields, derivatives, now } = input;
  const log = input.log ?? (() => {});

  try {
    const checkedFields = await validateFields(fields, worksStore);
    if (!checkedFields.ok) return { status: "invalid", ...checkedFields };
    const { id, categoryId, title, description } = checkedFields.value;

    const original = validateOriginal(input.original);
    if (!original.ok) return { status: "invalid", ...original };
    const photos = validateDerivatives(derivatives);
    if (!photos.ok) return { status: "invalid", ...photos };

    // Reintento de un envío ya guardado: éxito sin escribir de nuevo (FR-016).
    if (await worksStore.workExists(id)) return { status: "created", id };

    const ext = photos.ext;
    const contentType = ext === "webp" ? "image/webp" : "image/jpeg";
    const files: Array<[string, Uint8Array, string]> = [
      [
        originalKey(id, PHOTO_VERSION),
        input.original as Uint8Array,
        ORIGINAL_TYPES[original.type],
      ],
      ...(["sm", "md", "lg"] as PhotoSize[]).map(
        (size): [string, Uint8Array, string] => [
          derivativeKey(id, PHOTO_VERSION, size, ext),
          derivatives[size] as Uint8Array,
          contentType,
        ],
      ),
    ];
    const keys = files.map(([key]) => key);

    const rollback = async () => {
      try {
        await mediaStore.delete(keys);
      } catch (error) {
        log(`No se pudo deshacer la escritura en R2: ${String(error)}`);
      }
    };

    try {
      for (const [key, bytes, type] of files) {
        await mediaStore.put(key, bytes, type);
      }
      await worksStore.insertWork({
        id,
        categoryId,
        title,
        description,
        photoVersion: PHOTO_VERSION,
        photoExt: ext,
        createdAt: now,
      });
      // "duplicate" por una carrera: las claves son las mismas, el trabajo ya existe.
    } catch (error) {
      log(`Falló la creación del trabajo: ${String(error)}`);
      await rollback();
      return { status: "unavailable" };
    }
    return { status: "created", id };
  } catch (error) {
    // Falló la lectura de D1 (categoría o existencia) antes de escribir nada.
    log(`Falló la consulta previa: ${String(error)}`);
    return { status: "unavailable" };
  }
}
