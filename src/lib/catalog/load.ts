import type { WorksStore } from "../works/store";
import { resolveCategory, toCatalogCategories } from "./categories";
import type { CatalogCategory } from "./categories";
import { pageLimit, parsePage, slicePage, toCatalogCards } from "./view";
import type { CatalogCard } from "./view";

export type CatalogState = "items" | "empty" | "emptyCategory" | "error";

export interface CatalogData {
  state: CatalogState;
  categories: CatalogCategory[];
  cards: CatalogCard[];
  hasMore: boolean;
  /** Página mostrada (1 a `MAX_PAGE`). */
  page: number;
  /** Slug del filtro activo; `null` = Todos. */
  active: string | null;
}

/** Datos del catálogo para `?categoria` y `?pagina`; un fallo de D1 da `state: "error"`, nunca una excepción. */
export async function loadCatalog(
  store: WorksStore,
  query: { categoria?: string | null; pagina?: string | null },
): Promise<CatalogData> {
  const page = parsePage(query.pagina);
  try {
    const categories = await store.listCategories();
    const category = resolveCategory(categories, query.categoria);
    const active = category ? (query.categoria as string) : null;
    const rows = await store.listWorks(pageLimit(page), category?.id);
    const { items, hasMore } = slicePage(rows, page);
    return {
      state: items.length > 0 ? "items" : category ? "emptyCategory" : "empty",
      categories: toCatalogCategories(categories, active),
      cards: toCatalogCards(items),
      hasMore,
      page,
      active,
    };
  } catch (cause) {
    console.error(`No se pudo cargar el catálogo: ${String(cause)}`);
    return {
      state: "error",
      categories: [],
      cards: [],
      hasMore: false,
      page,
      active: null,
    };
  }
}
