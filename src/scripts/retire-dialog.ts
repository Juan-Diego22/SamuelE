import { MESSAGES } from "../lib/works/messages";

const dialog = document.querySelector<HTMLDialogElement>("#retire-dialog");
const form = document.querySelector<HTMLFormElement>("#retire-form");
const nameLine = document.querySelector<HTMLElement>("#retire-dialog-name");
const errorBox = document.querySelector<HTMLElement>("#retire-dialog-error");
const buttons = document.querySelectorAll<HTMLButtonElement>("[data-retire]");

const CONFIRM_TEXT =
  "¿Retirar este trabajo? Dejará de verse en el catálogo público.";

if (dialog && form && nameLine && errorBox) {
  const confirmButton = form.querySelector<HTMLButtonElement>(
    "button[type=submit]",
  )!;
  const cancelButton = form.querySelector<HTMLButtonElement>(
    "[data-retire-cancel]",
  )!;
  let busy = false;

  /** Retirar solo se ofrece cuando el script puede pedir confirmación (research D9). */
  buttons.forEach((button) => {
    button.hidden = false;
  });

  function setBusy(value: boolean) {
    busy = value;
    confirmButton.disabled = value;
    confirmButton.textContent = value ? "Retirando…" : "Retirar";
    form!.setAttribute("aria-busy", String(value));
  }

  /** Envía el retiro con `fetch` y decide a dónde ir según la respuesta. */
  async function submit(action: string): Promise<boolean> {
    try {
      const response = await fetch(action, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (response.ok) {
        window.location.assign("/admin?retirado=1");
        return true;
      }
      if (response.status === 404) {
        window.location.assign("/admin?noDisponible=1");
        return true;
      }
      if (response.status === 401) {
        window.location.assign("/admin/login");
        return true;
      }
    } catch {
      // Cae al mensaje de error de abajo.
    }
    return false;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.workId ?? "";
      const action = `/api/admin/works/${encodeURIComponent(id)}/retire`;

      if (typeof dialog.showModal !== "function") {
        // Navegador sin <dialog>: nunca se retira sin preguntar.
        if (!window.confirm(CONFIRM_TEXT)) return;
        if (!(await submit(action))) window.alert(MESSAGES.retireFailed);
        return;
      }

      form.action = action;
      nameLine.textContent = button.dataset.workTitle ?? "";
      errorBox.hidden = true;
      errorBox.textContent = "";
      setBusy(false);
      dialog.showModal();
    });
  });

  cancelButton.addEventListener("click", () => dialog.close());
  // Mientras se envía no se cierra con Escape ni se envía dos veces.
  dialog.addEventListener("cancel", (event) => {
    if (busy) event.preventDefault();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    errorBox.hidden = true;
    const redirected = await submit(form.action);
    if (!redirected) {
      errorBox.textContent = MESSAGES.retireFailed;
      errorBox.hidden = false;
      setBusy(false);
    }
  });
}
