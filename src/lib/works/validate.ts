import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "./limits";
import { MESSAGES } from "./messages";
import type { Failure } from "./media";
import type { WorksStore } from "./store";

export interface RawFields {
  id: string;
  category: string;
  title: string;
  description: string;
}

export interface ValidFields {
  id: string;
  categoryId: number;
  title: string | null;
  description: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida los campos de texto y la categoría; el texto se guarda tal cual (Astro lo escapa al mostrarlo). */
export async function validateFields(
  raw: RawFields,
  store: Pick<WorksStore, "categoryExists">,
): Promise<{ ok: true; value: ValidFields } | Failure> {
  if (!UUID.test(raw.id)) {
    return { ok: false, field: "form", message: MESSAGES.invalidId };
  }

  const categoryId = /^\d+$/.test(raw.category.trim())
    ? Number(raw.category.trim())
    : NaN;
  if (
    !Number.isSafeInteger(categoryId) ||
    !(await store.categoryExists(categoryId))
  ) {
    return { ok: false, field: "category", message: MESSAGES.categoryMissing };
  }

  const title = raw.title.trim();
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, field: "title", message: MESSAGES.titleTooLong };
  }
  const description = raw.description.trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      field: "description",
      message: MESSAGES.descriptionTooLong,
    };
  }

  return {
    ok: true,
    value: {
      id: raw.id,
      categoryId,
      title: title || null,
      description: description || null,
    },
  };
}
