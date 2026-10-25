import { mediaUrl } from "./keys";
import type { PhotoExt } from "./keys";
import type { ListedWork } from "./store";

export interface EditValues {
  id: string;
  categoryId: number;
  /** Las filas antiguas de 003 pueden no tener título: se pide escribirlo para guardar. */
  title: string;
  description: string;
  photoVersion: number;
  /** URL de la foto actual (`md`, con su versión) para la vista previa. */
  photoUrl: string;
}

/** Valores para precargar el formulario de edición. */
export function toEditValues(work: ListedWork): EditValues {
  return {
    id: work.id,
    categoryId: work.categoryId,
    title: work.title ?? "",
    description: work.description ?? "",
    photoVersion: work.photoVersion,
    photoUrl: mediaUrl(
      work.id,
      work.photoVersion,
      "md",
      work.photoExt as PhotoExt,
    ),
  };
}
