import { derivativeKey } from "./keys";
import type { PhotoExt } from "./keys";
import { validateDerivatives, validateOriginal } from "./media";
import { MESSAGES } from "./messages";
import type { ErrorField } from "./messages";
import { photoFiles, photoKeys } from "./photo-files";
import type { MediaStore, WorksStore } from "./store";
import { UUID, validateEditFields } from "./validate";
import type { EditFields } from "./validate";

export interface UpdateWorkInput {
  worksStore: WorksStore;
  mediaStore: MediaStore;
  id: string;
  /** `photo_version` que el navegador cargó; obligatoria solo con foto nueva. */
  baseVersion: number | undefined;
  fields: EditFields;
  original: Uint8Array | undefined;
  derivatives: { sm?: Uint8Array; md?: Uint8Array; lg?: Uint8Array };
  /** Para registrar fallos de limpieza; por defecto no hace nada. */
  log?: (message: string) => void;
}

export type UpdateWorkResult =
  | { status: "updated"; photoVersion: number }
  | { status: "invalid"; field: ErrorField; message: string }
  | { status: "not_available" }
  | { status: "conflict" }
  | { status: "unavailable" };

async function readBytes(
  body: ReadableStream | Uint8Array,
): Promise<Uint8Array> {
  return body instanceof Uint8Array
    ? body
    : new Uint8Array(await new Response(body).arrayBuffer());
}

/** ¿La versión guardada es la misma foto que llega? Distingue un reintento de otra pestaña. */
async function isSamePhoto(
  mediaStore: MediaStore,
  id: string,
  version: number,
  ext: string,
  sm: Uint8Array,
): Promise<boolean> {
  const stored = await mediaStore.get(
    derivativeKey(id, version, "sm", ext as PhotoExt),
  );
  if (!stored) return false;
  const bytes = await readBytes(stored.body);
  return bytes.length === sm.length && bytes.every((b, i) => b === sm[i]);
}

const invalid = ({
  field,
  message,
}: {
  field: ErrorField;
  message: string;
}): UpdateWorkResult => ({ status: "invalid", field, message });

/**
 * Edita un trabajo activo. Sin foto nueva solo toca D1; con foto nueva escribe la versión
 * siguiente en R2, actualiza D1 con condición sobre la versión y solo entonces borra la
 * anterior (research D3 y D4): el trabajo nunca apunta a archivos incompletos.
 */
export async function updateWork(
  input: UpdateWorkInput,
): Promise<UpdateWorkResult> {
  const { worksStore, mediaStore, id, baseVersion, derivatives } = input;
  const log = input.log ?? (() => {});

  if (!UUID.test(id)) return { status: "not_available" };

  try {
    const checked = await validateEditFields(input.fields, worksStore);
    if (!checked.ok) return invalid(checked);
    const { categoryId, title, description } = checked.value;
    const patch = { categoryId, title, description };

    const parts = [
      input.original,
      derivatives.sm,
      derivatives.md,
      derivatives.lg,
    ];
    const hasPhoto = parts.some((part) => part !== undefined);

    let photo: { ext: PhotoExt; type: "jpeg" | "png" | "webp" } | undefined;
    if (hasPhoto) {
      // Todos o ninguno (research D4).
      if (parts.some((part) => part === undefined)) {
        return {
          status: "invalid",
          field: "photo",
          message: MESSAGES.derivativesInvalid,
        };
      }
      const original = validateOriginal(input.original);
      if (!original.ok) return invalid(original);
      const derived = validateDerivatives(derivatives);
      if (!derived.ok) return invalid(derived);
      photo = { ext: derived.ext, type: original.type };
    }

    const current = await worksStore.getWork(id);
    if (!current) return { status: "not_available" };

    if (!photo) {
      const result = await worksStore.updateWork(id, patch);
      if (result === "updated") {
        return { status: "updated", photoVersion: current.photoVersion };
      }
      return result === "conflict"
        ? { status: "conflict" }
        : { status: "not_available" };
    }

    if (baseVersion === undefined || !Number.isSafeInteger(baseVersion)) {
      return { status: "conflict" };
    }
    const version = baseVersion + 1;
    // Reintento de un guardado con foto que ya se aplicó: éxito sin escribir de nuevo.
    // Si la foto guardada es otra, la versión la dejó un guardado distinto (otra pestaña).
    if (
      current.photoVersion === version &&
      (await isSamePhoto(
        mediaStore,
        id,
        version,
        current.photoExt,
        derivatives.sm as Uint8Array,
      ))
    ) {
      return { status: "updated", photoVersion: version };
    }
    if (current.photoVersion !== baseVersion) return { status: "conflict" };

    const files = photoFiles({
      id,
      version,
      ext: photo.ext,
      original: input.original as Uint8Array,
      originalType: photo.type,
      derivatives,
    });
    const newKeys = files.map(([key]) => key);
    const rollback = async () => {
      try {
        await mediaStore.delete(newKeys);
      } catch (error) {
        log(`No se pudo deshacer la escritura en R2: ${String(error)}`);
      }
    };

    let result: "updated" | "not_found" | "conflict";
    try {
      for (const [key, bytes, type] of files) {
        await mediaStore.put(key, bytes, type);
      }
      result = await worksStore.updateWork(
        id,
        { ...patch, photo: { version, ext: photo.ext } },
        baseVersion,
      );
    } catch (error) {
      log(`Falló la edición del trabajo: ${String(error)}`);
      await rollback();
      return { status: "unavailable" };
    }

    if (result !== "updated") {
      // Si otro guardado idéntico ganó la carrera, esas claves ya son suyas: no se borran.
      const winner = await worksStore.getWork(id).catch(() => null);
      if (winner?.photoVersion !== version) await rollback();
      return result === "conflict"
        ? { status: "conflict" }
        : { status: "not_available" };
    }

    // Mejor esfuerzo: un fallo deja archivos huérfanos pero el guardado ya fue correcto (R3).
    try {
      await mediaStore.delete(
        photoKeys(id, current.photoVersion, current.photoExt as PhotoExt),
      );
    } catch (error) {
      log(`No se pudo borrar la foto anterior: ${String(error)}`);
    }
    return { status: "updated", photoVersion: version };
  } catch (error) {
    log(`Falló la consulta previa a la edición: ${String(error)}`);
    return { status: "unavailable" };
  }
}
