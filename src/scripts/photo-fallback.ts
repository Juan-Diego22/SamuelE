// Una foto que no carga se oculta para que se vea el logo de fondo en lugar del ícono de imagen rota.
// Se revisan también las que ya fallaron antes de que este script se ejecutara.
for (const img of document.querySelectorAll<HTMLImageElement>(
  "img[data-photo]",
)) {
  const hide = () => {
    img.hidden = true;
  };
  img.addEventListener("error", hide);
  if (img.complete && img.naturalWidth === 0) hide();
}
