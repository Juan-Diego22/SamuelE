// "← Volver": si se llegó desde el catálogo, retrocede en el historial para conservar
// el filtro y la posición de la lista; en otro caso el enlace lleva al catálogo completo.
const link = document.querySelector<HTMLAnchorElement>("[data-back]");

link?.addEventListener("click", (event) => {
  if (!document.referrer) return;
  let referrer: URL;
  try {
    referrer = new URL(document.referrer);
  } catch {
    return;
  }
  if (referrer.origin === location.origin && referrer.pathname === "/") {
    event.preventDefault();
    history.back();
  }
});
