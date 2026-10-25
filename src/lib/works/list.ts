import { mediaUrl } from "./keys";
import type { PhotoExt } from "./keys";
import type { ListedWork } from "./store";

export interface PanelItem {
  id: string;
  title: string;
  editHref: string;
  category: string;
  thumbnailUrl: string;
}

/** Filas de la lista del panel: más reciente primero, con la categoría como título de respaldo (FR-002). */
export function toPanelItems(rows: ListedWork[]): PanelItem[] {
  return [...rows]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((row) => ({
      id: row.id,
      title: row.title ?? row.categoryName,
      editHref: `/admin/works/${row.id}/edit`,
      category: row.categoryName,
      thumbnailUrl: mediaUrl(
        row.id,
        row.photoVersion,
        "sm",
        row.photoExt as PhotoExt,
      ),
    }));
}
