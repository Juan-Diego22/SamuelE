import type { Category } from "../works/store";

export interface CatalogCategory {
  /** `null` en "Todos". */
  slug: string | null;
  name: string;
  href: string;
  active: boolean;
}

/** `Tortas` → `tortas`; sin tildes ni espacios sobrantes. */
export function categorySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** La categoría del filtro; `null` (= "Todos") si falta, es desconocida o viene repetida. */
export function resolveCategory(
  categories: Category[],
  slug: string | null | undefined,
): Category | null {
  if (!slug) return null;
  return categories.find((c) => categorySlug(c.name) === slug) ?? null;
}

/** "Todos" y una entrada por categoría, aunque no tenga trabajos (FR-005). */
export function toCatalogCategories(
  categories: Category[],
  activeSlug: string | null,
): CatalogCategory[] {
  return [
    {
      slug: null,
      name: "Todos",
      href: "/",
      active: activeSlug === null,
    },
    ...categories.map((c) => {
      const slug = categorySlug(c.name);
      return {
        slug,
        name: c.name,
        href: `/?categoria=${slug}`,
        active: activeSlug === slug,
      };
    }),
  ];
}
