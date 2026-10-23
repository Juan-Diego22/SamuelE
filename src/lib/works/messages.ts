/** Mensajes de error en lenguaje sencillo (data-model.md, "Validaciones"). */
export const MESSAGES = {
  invalidId: "No pudimos publicar el trabajo. Intenta de nuevo.",
  categoryMissing: "Elige una categoría.",
  photoMissing: "Elige una foto.",
  titleMissing: "Escribe un título.",
  titleTooLong: "El título es muy largo (máximo 80 caracteres).",
  descriptionTooLong: "La descripción es muy larga (máximo 1000 caracteres).",
  photoTooLarge: "La foto pesa demasiado (máximo 15 MB).",
  photoFormat: "Esa foto no tiene un formato admitido. Usa JPEG, PNG o WebP.",
  derivativesInvalid: "No pudimos preparar la foto. Intenta con otra.",
  saveFailed: "No pudimos guardar el trabajo. Intenta de nuevo.",
  notAvailable: "Ese trabajo ya no está disponible.",
  conflict: "Este trabajo cambió. Recarga la página e inténtalo de nuevo.",
  retireFailed: "No pudimos retirar el trabajo. Intenta de nuevo.",
  retired: "Trabajo retirado.",
  updated: "Trabajo actualizado.",
  listFailed:
    "No pudimos cargar tus trabajos. Intenta de nuevo en unos minutos.",
  formUnavailable:
    "No pudimos cargar el formulario. Intenta de nuevo en unos minutos.",
} as const;

/** Campo al que se asocia un error; el cliente lo usa para mostrarlo junto al campo. */
export type ErrorField =
  "category" | "title" | "description" | "original" | "photo" | "form";
