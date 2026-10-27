import { LIST_LIMIT } from "../works/limits";
import { mediaUrl } from "../works/keys";
import type { PhotoExt } from "../works/keys";
import type { ListedWork } from "../works/store";

export const CATALOG_PAGE_SIZE = 24;
/** Tope de páginas acumulativas; no supera `LIST_LIMIT` (el máximo que ya lee el panel). */
export const MAX_PAGE = Math.floor(LIST_LIMIT / CATALOG_PAGE_SIZE);
/** Las páginas públicas siempre se revalidan: lo que cambia el panel se ve en la siguiente visita (FR-024). */
export const CATALOG_CACHE_CONTROL = "no-cache";

export interface CatalogCard {
  id: string;
  href: string;
  title: string;
  category: string;
  photoUrl: string;
  alt: string;
}

/** `?pagina=N` válido entre 1 y `MAX_PAGE`; cualquier otra cosa es la primera página. */
export function parsePage(raw: string | null | undefined): number {
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return page < 1 ? 1 : Math.min(page, MAX_PAGE);
}

/** Filas a pedir: las de la página y una más para saber si hay más (FR-011). */
export function pageLimit(page: number): number {
  return CATALOG_PAGE_SIZE * page + 1;
}

export function slicePage<T>(
  rows: T[],
  page: number,
): { items: T[]; hasMore: boolean } {
  const size = CATALOG_PAGE_SIZE * page;
  return { items: rows.slice(0, size), hasMore: rows.length > size };
}

/** Tarjetas para la grilla: título (o categoría si no tiene) y miniatura `sm` versionada. */
export function toCatalogCards(rows: ListedWork[]): CatalogCard[] {
  return rows.map((row) => {
    const title = row.title ?? row.categoryName;
    return {
      id: row.id,
      href: `/trabajos/${row.id}`,
      title,
      category: row.categoryName,
      photoUrl: mediaUrl(
        row.id,
        row.photoVersion,
        "sm",
        row.photoExt as PhotoExt,
      ),
      alt: `${title} — ${row.categoryName}`,
    };
  });
}
