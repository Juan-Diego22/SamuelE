import { mediaUrl } from "../works/keys";
import type { PhotoExt } from "../works/keys";
import type { ListedWork, WorksStore } from "../works/store";
import { UUID } from "../works/validate";
import { workWhatsappUrl } from "./whatsapp";

export interface DetailView {
  title: string;
  category: string;
  /** Ausente cuando el trabajo no tiene descripción. */
  description?: string;
  photoMd: string;
  photoLg: string;
  alt: string;
  whatsappUrl: string;
}

export type DetailData =
  | { state: "found"; view: DetailView }
  | { state: "notFound" }
  | { state: "error" };

export function toDetailView(work: ListedWork): DetailView {
  const title = work.title ?? work.categoryName;
  const ext = work.photoExt as PhotoExt;
  return {
    title,
    category: work.categoryName,
    description: work.description?.trim() ? work.description : undefined,
    photoMd: mediaUrl(work.id, work.photoVersion, "md", ext),
    photoLg: mediaUrl(work.id, work.photoVersion, "lg", ext),
    alt: `${title} — ${work.categoryName}`,
    whatsappUrl: workWhatsappUrl(title),
  };
}

const SHARE_MAX = 150;

/** Texto corto para la vista previa: descripción sin saltos de línea y ≤150 caracteres (sin cortar palabras). */
export function shareDescription(view: DetailView): string {
  const text = view.description?.replace(/\s+/g, " ").trim();
  if (!text) return `${view.category} de Samuelé Repostería`;
  if (text.length <= SHARE_MAX) return text;
  const cut = text.slice(0, SHARE_MAX - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Detalle de un trabajo activo; retirado, inexistente o id no válido son `notFound` (sin distinguirlos). */
export async function loadDetail(
  store: WorksStore,
  id: string | undefined,
): Promise<DetailData> {
  if (!id || !UUID.test(id)) return { state: "notFound" };
  try {
    const work = await store.getWork(id);
    return work
      ? { state: "found", view: toDetailView(work) }
      : { state: "notFound" };
  } catch (cause) {
    console.error(`No se pudo cargar el trabajo ${id}: ${String(cause)}`);
    return { state: "error" };
  }
}
