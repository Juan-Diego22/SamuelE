import { createWork } from "./create";
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
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return fail(400, "form", MESSAGES.saveFailed);
  }
  // Antes de leer el cuerpo: ahorra CPU con envíos desmedidos (riesgo R1).
  const length = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return fail(413, "form", MESSAGES.photoTooLarge);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "form", MESSAGES.saveFailed);
  }

  const result = await createWork({
    worksStore: deps.worksStore,
    mediaStore: deps.mediaStore,
    fields: {
      id: text(form.get("id")),
      category: text(form.get("category")),
      title: text(form.get("title")),
      description: text(form.get("description")),
    },
    original: await fileBytes(form.get("original")),
    derivatives: {
      sm: await fileBytes(form.get("sm")),
      md: await fileBytes(form.get("md")),
      lg: await fileBytes(form.get("lg")),
    },
    now: deps.now,
    log: deps.log,
  });

  if (result.status === "created") return json(201, { id: result.id });
  if (result.status === "invalid") {
    return fail(422, result.field, result.message);
  }
  return fail(503, "form", MESSAGES.saveFailed);
}
