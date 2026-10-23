import { createWork } from "./create";
import { retireWork } from "./retire";
import { updateWork } from "./update";
import { MAX_DERIVATIVE_BYTES, MAX_ORIGINAL_BYTES } from "./limits";
import type { ErrorField } from "./messages";
import { MESSAGES } from "./messages";
import type { MediaStore, WorksStore } from "./store";

/** Tope del cuerpo: la original, tres derivadas y 64 KB de campos y cabeceras. */
export const MAX_BODY_BYTES =
  MAX_ORIGINAL_BYTES + 3 * MAX_DERIVATIVE_BYTES + 64 * 1024;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function fail(status: number, field: ErrorField, message: string): Response {
  return json(status, { error: { field, message } });
}

async function fileBytes(
  value: FormDataEntryValue | null,
): Promise<Uint8Array | undefined> {
  if (typeof value === "string" || value === null) return undefined;
  return new Uint8Array(await value.arrayBuffer());
}

const text = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value : "";

/** Comprueba el tipo y el tamaño antes de leer el cuerpo `multipart/form-data`. */
async function readForm(request: Request): Promise<FormData | Response> {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return fail(400, "form", MESSAGES.saveFailed);
  }
  // Antes de leer el cuerpo: ahorra CPU con envíos desmedidos (riesgo R1).
  const length = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return fail(413, "form", MESSAGES.photoTooLarge);
  }
  try {
    return await request.formData();
  } catch {
    return fail(400, "form", MESSAGES.saveFailed);
  }
}

/** Las cuatro partes de la foto, o `undefined` en las que no vienen. */
async function photoParts(form: FormData) {
  return {
    original: await fileBytes(form.get("original")),
    derivatives: {
      sm: await fileBytes(form.get("sm")),
      md: await fileBytes(form.get("md")),
      lg: await fileBytes(form.get("lg")),
    },
  };
}

/** `POST /api/admin/works`: el middleware ya exigió sesión y `Origin` propio. */
export async function handleCreateWork(
  request: Request,
  deps: {
    worksStore: WorksStore;
    mediaStore: MediaStore;
    now: number;
    log?: (message: string) => void;
  },
): Promise<Response> {
  const form = await readForm(request);
  if (form instanceof Response) return form;

  const result = await createWork({
    worksStore: deps.worksStore,
    mediaStore: deps.mediaStore,
    fields: {
      id: text(form.get("id")),
      category: text(form.get("category")),
      title: text(form.get("title")),
      description: text(form.get("description")),
    },
    ...(await photoParts(form)),
    now: deps.now,
    log: deps.log,
  });

  if (result.status === "created") return json(201, { id: result.id });
  if (result.status === "invalid") {
    return fail(422, result.field, result.message);
  }
  return fail(503, "form", MESSAGES.saveFailed);
}

/** `POST /api/admin/works/{id}/retire`: JSON para el script del diálogo, 303 para un formulario HTML. */
export async function handleRetireWork(
  request: Request,
  id: string,
  deps: {
    worksStore: WorksStore;
    now: number;
    log?: (message: string) => void;
  },
): Promise<Response> {
  const result = await retireWork({ ...deps, id });
  const wantsJson = (request.headers.get("Accept") ?? "").includes(
    "application/json",
  );

  if (wantsJson) {
    if (result.status === "retired") return json(200, { id });
    if (result.status === "not_available") {
      return fail(404, "form", MESSAGES.notAvailable);
    }
    return fail(503, "form", MESSAGES.retireFailed);
  }

  const location =
    result.status === "retired"
      ? "/admin?retirado=1"
      : result.status === "not_available"
        ? "/admin?noDisponible=1"
        : "/admin";
  return new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}

/** `PUT /api/admin/works/{id}`: foto opcional; con foto nueva exige `baseVersion`. */
export async function handleUpdateWork(
  request: Request,
  id: string,
  deps: {
    worksStore: WorksStore;
    mediaStore: MediaStore;
    log?: (message: string) => void;
  },
): Promise<Response> {
  const form = await readForm(request);
  if (form instanceof Response) return form;

  const base = text(form.get("baseVersion")).trim();
  const result = await updateWork({
    worksStore: deps.worksStore,
    mediaStore: deps.mediaStore,
    id,
    baseVersion: /^\d+$/.test(base) ? Number(base) : undefined,
    fields: {
      category: text(form.get("category")),
      title: text(form.get("title")),
      description: text(form.get("description")),
    },
    ...(await photoParts(form)),
    log: deps.log,
  });

  switch (result.status) {
    case "updated":
      return json(200, { id, photoVersion: result.photoVersion });
    case "invalid":
      return fail(422, result.field, result.message);
    case "not_available":
      return fail(404, "form", MESSAGES.notAvailable);
    case "conflict":
      return fail(409, "form", MESSAGES.conflict);
    default:
      return fail(503, "form", MESSAGES.saveFailed);
  }
}
