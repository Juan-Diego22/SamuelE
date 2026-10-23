import { optimizePhoto } from "../lib/photo/optimize";
import type { OptimizedPhoto } from "../lib/photo/optimize";
import { MESSAGES } from "../lib/works/messages";

const form = document.querySelector<HTMLFormElement>("#work-form");

/** UUID v4. `crypto.randomUUID` solo existe en contextos seguros; en `http://<IP>` (pruebas en celular) no. */
function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

if (form) {
  const photoInput = form.querySelector<HTMLInputElement>("#photo")!;
  const preview = form.querySelector<HTMLImageElement>("#photo-preview")!;
  const drop = form.querySelector<HTMLElement>(".photo-drop")!;
  const category = document.getElementById(
    "category",
  ) as unknown as HTMLSelectElement;
  const title = form.querySelector<HTMLInputElement>("#title")!;
  const description = form.querySelector<HTMLTextAreaElement>("#description")!;
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;

  // En edición el trabajo ya existe: su `id` va en la ruta y la foto es opcional.
  const editing = form.dataset.mode === "edit";
  const editId = form.dataset.workId ?? "";
  const baseVersion = form.dataset.photoVersion ?? "";
  // Vista previa inicial (foto actual al editar) a la que se vuelve si se cancela el selector.
  const initialPreview = editing ? preview.getAttribute("src") : null;

  // El mismo `id` en cada reintento hace idempotente el envío (FR-016); cambia si cambia la foto.
  let workId = newId();
  let optimized: { file: File; result: OptimizedPhoto } | null = null;

  const errorBox = (field: string) =>
    form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);

  function clearErrors() {
    form!.querySelectorAll<HTMLElement>("[data-error-for]").forEach((box) => {
      box.hidden = true;
      box.textContent = "";
    });
  }

  function showError(field: string, message: string) {
    // El servidor llama "original" y "photo" a problemas de la foto: ambos van junto a ella.
    const target = field === "original" ? "photo" : field;
    const box = errorBox(target) ?? errorBox("form");
    if (!box) return;
    box.textContent = message;
    box.hidden = false;
  }

  function setBusy(busy: boolean) {
    button.disabled = busy;
    button.textContent = busy
      ? editing
        ? "Guardando…"
        : "Publicando…"
      : editing
        ? "Guardar"
        : "Publicar";
    form!.setAttribute("aria-busy", String(busy));
  }

  function showPreview(src: string | null) {
    if (src) {
      preview.src = src;
      preview.hidden = false;
    } else {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
    drop.classList.toggle("has-photo", src !== null);
  }

  photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (preview.src.startsWith("blob:")) URL.revokeObjectURL(preview.src);
    optimized = null;
    // El `id` nuevo por foto elegida solo aplica a "Nuevo".
    if (!editing) workId = newId();
    showPreview(file ? URL.createObjectURL(file) : initialPreview);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const file = photoInput.files?.[0];
    let invalid = false;
    if (!file && !editing) {
      showError("photo", MESSAGES.photoMissing);
      invalid = true;
    }
    if (!category.value) {
      showError("category", MESSAGES.categoryMissing);
      invalid = true;
    }
    if (!title.value.trim()) {
      showError("title", MESSAGES.titleMissing);
      invalid = true;
    }
    if (invalid) return;

    setBusy(true);
    try {
      const data = new FormData();
      data.set("category", category.value);
      data.set("title", title.value);
      data.set("description", description.value);

      // Solo una foto elegida se optimiza y se envía (en edición, sin foto nueva no se toca R2).
      if (file) {
        if (!optimized || optimized.file !== file) {
          optimized = { file, result: await optimizePhoto(file) };
        }
        const { sm, md, lg, ext } = optimized.result;
        data.set("original", file, file.name);
        data.set("sm", sm, `sm.${ext}`);
        data.set("md", md, `md.${ext}`);
        data.set("lg", lg, `lg.${ext}`);
        if (editing) data.set("baseVersion", baseVersion);
      }
      if (!editing) data.set("id", workId);

      const response = await fetch(
        editing
          ? `/api/admin/works/${encodeURIComponent(editId)}`
          : "/api/admin/works",
        {
          method: editing ? "PUT" : "POST",
          body: data,
          credentials: "same-origin",
        },
      );

      if (response.status === (editing ? 200 : 201)) {
        window.location.assign(
          editing ? "/admin?actualizado=1" : "/admin?publicado=1",
        );
        return;
      }
      if (editing && response.status === 404) {
        window.location.assign("/admin?noDisponible=1");
        return;
      }
      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const body = (await response.json().catch(() => null)) as {
        error?: { field?: string; message?: string };
      } | null;
      showError(
        body?.error?.field ?? "form",
        body?.error?.message ?? MESSAGES.saveFailed,
      );
    } catch (error) {
      // Fallo de `optimizePhoto` (mensaje ya sencillo) o de red: se conservan todos los campos.
      const known = Object.values(MESSAGES) as string[];
      const message =
        error instanceof Error && known.includes(error.message)
          ? error.message
          : MESSAGES.saveFailed;
      showError(message === MESSAGES.photoFormat ? "photo" : "form", message);
    } finally {
      setBusy(false);
    }
  });
}
