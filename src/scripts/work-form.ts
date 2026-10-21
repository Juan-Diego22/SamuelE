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
  const category = document.getElementById(
    "category",
  ) as unknown as HTMLSelectElement;
  const title = form.querySelector<HTMLInputElement>("#title")!;
  const description = form.querySelector<HTMLTextAreaElement>("#description")!;
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;

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
    button.textContent = busy ? "Publicando…" : "Publicar";
    form!.setAttribute("aria-busy", String(busy));
  }

  photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (preview.src) URL.revokeObjectURL(preview.src);
    optimized = null;
    workId = newId();
    if (file) {
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
    } else {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const file = photoInput.files?.[0];
    let invalid = false;
    if (!file) {
      showError("photo", MESSAGES.photoMissing);
      invalid = true;
    }
    if (!category.value) {
      showError("category", MESSAGES.categoryMissing);
      invalid = true;
    }
    if (invalid || !file) return;

    setBusy(true);
    try {
      if (!optimized || optimized.file !== file) {
        optimized = { file, result: await optimizePhoto(file) };
      }
      const { sm, md, lg } = optimized.result;

      const data = new FormData();
      data.set("id", workId);
      data.set("category", category.value);
      data.set("title", title.value);
      data.set("description", description.value);
      data.set("original", file, file.name);
      data.set("sm", sm, `sm.${optimized.result.ext}`);
      data.set("md", md, `md.${optimized.result.ext}`);
      data.set("lg", lg, `lg.${optimized.result.ext}`);

      const response = await fetch("/api/admin/works", {
        method: "POST",
        body: data,
        credentials: "same-origin",
      });

      if (response.status === 201) {
        window.location.assign("/admin?publicado=1");
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
