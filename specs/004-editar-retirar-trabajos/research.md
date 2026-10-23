# Investigación: Editar y retirar los trabajos del panel

Las decisiones grandes ya están en los ADR 0003, 0004 y 0005 y en la investigación de [003](../003-panel-nuevo-trabajo/research.md). Aquí se resuelven los detalles que esta spec deja abiertos. No quedan `NEEDS CLARIFICATION`.

## D1. Retiro: borrado lógico con `retired_at`

- **Decisión**: columna nueva `works.retired_at` (entero, nulo; milisegundos UTC). Un trabajo está **activo** si es nulo. La lista y la edición consultan solo activos. Los archivos de R2 no se tocan (ADR 0004: "retirar lo oculta del catálogo y no borra archivos").
- **Motivo**: una fecha en lugar de un booleano da la misma información y permite saber cuándo se retiró (útil si algún día se restaura o se limpia). Una migración de una columna es la más pequeña posible.
- **Alternativas**: columna booleana `retired` (pierde la fecha); tabla aparte de retirados (innecesaria); borrado físico (descartado por el ADR 0004 y por la spec).
- **Índice**: no se añade. A cientos de filas la consulta ya está acotada por `works_created_at_idx` y `LIMIT 200`; se revisa cuando llegue el catálogo (Hito 4).
- **Efecto en 003**: `listWorks` agrega `WHERE retired_at IS NULL`. `workExists` (idempotencia de creación) sigue contando también los retirados, porque el `id` es la clave primaria.

## D2. Rutas: `PUT /api/admin/works/{id}` y `POST /api/admin/works/{id}/retire`

- **Decisión**: edición con `PUT` multipart (mismos campos que `POST` de 003, más `baseVersion`; foto opcional); retiro con `POST …/retire` sin cuerpo.
- **Motivo**: `PUT` expresa "reemplazar el estado editable" y el middleware ya exige `Origin` propio para cualquier método no seguro (`isSafeMethod`). Retirar es una acción, no un reemplazo ni un borrado físico, por eso `POST …/retire` en vez de `DELETE` (que sugeriría que el recurso desaparece).
- **Sin JavaScript**: `…/retire` acepta un envío de formulario HTML normal y responde `303` a `/admin?retirado=1`; con `Accept: application/json` (el script del diálogo) responde JSON. Así la acción más riesgosa no depende de que el script cargue.
- **Alternativas**: `PATCH` (equivalente, `PUT` ya multipart simplifica reusar la lectura del cuerpo); una sola ruta con campo `action` (mezcla responsabilidades).

## D3. Reemplazo de foto: versión nueva, escritura condicional, borrado al final

- **Decisión**: con foto nueva, `update.ts`:
  1. valida campos, original y derivadas (mismas funciones que 003);
  2. lee el trabajo activo (`getWork`); si no existe o está retirado → "no disponible";
  3. exige `baseVersion` (la versión que el navegador cargó). Si `photoVersion === baseVersion + 1` es un reintento de un guardado ya aplicado → éxito sin escribir. Si es distinta de `baseVersion` → conflicto 409 ("Este trabajo cambió. Recarga la página");
  4. escribe en R2 las cuatro claves de la versión `baseVersion + 1` (las de la versión actual siguen intactas);
  5. `UPDATE works … WHERE id = ? AND photo_version = baseVersion AND retired_at IS NULL`; si no cambia ninguna fila, borra lo recién escrito y responde conflicto/no disponible;
  6. solo tras el éxito, borra de R2 las claves de la versión anterior (mejor esfuerzo, riesgo R3).
- **Motivo**: cumple FR-014/FR-015. Nunca hay un momento en que el trabajo apunte a archivos incompletos (D1 se actualiza al final, como en 003 D5) y la versión vieja sigue siendo válida hasta que la nueva está completa. La condición sobre `photo_version` evita que dos pestañas pisen la foto de forma incoherente; el caso de un solo guardado repetido (doble toque, reintento por red) queda idempotente.
- **Caché (FR-014)**: `/media` responde `immutable` por un año, pero la URL contiene la versión, así que una versión nueva es una URL nueva; ningún caché del navegador puede mostrar la foto vieja ni hace falta invalidar nada.
- **Extensión**: la versión nueva puede tener otra extensión (`webp` ↔ `jpg`); las claves viejas se calculan con la extensión guardada en el trabajo antes de actualizarlo.
- **Qué se borra**: derivadas y original de la versión anterior (4 claves, una llamada `delete`). La original conserva EXIF; no hay motivo para conservarla si ya no se usa (principio III y costo de almacenamiento).
- **Riesgo R3 (huérfanos)**: si el borrado de la versión vieja falla, quedan archivos sin uso; se registra en el log del Worker y no se avisa a la administradora (el guardado ya fue correcto). Sin ruta pública salvo conocer la clave (UUID); la limpieza periódica queda fuera de alcance, igual que en 003 D5.
- **Alternativas**: sobrescribir las mismas claves (rompe el caché inmutable y no es atómico); borrar la versión vieja antes de confirmar (puede dejar el trabajo sin foto ante un fallo, viola FR-015).

## D4. Editar sin foto nueva: sin tocar R2

- **Decisión**: si el `PUT` no trae `original`, `sm`, `md` ni `lg`, solo se hace `UPDATE` de `category_id`, `title` y `description` (y la foto queda igual). Si trae alguno pero no todos, error 422 de foto (misma regla de "tres derivadas obligatorias" de 003).
- **Motivo**: FR-012. Ahorra CPU y ancho de banda del celular, y reduce el riesgo de fallos.
- **Cliente**: el script no optimiza ni envía foto salvo que la administradora haya elegido un archivo nuevo.

## D5. Título obligatorio

- **Decisión**: `validateFields` rechaza un título vacío o solo con espacios con "Escribe un título." (`field: "title"`), en creación y edición. La columna `title` sigue admitiendo nulo en la base: hay filas de 003 sin título y no se reescribe la historia con una migración de datos.
- **Motivo**: la spec lo pide (formulario completo salvo descripción). Mantener la columna nula evita una migración riesgosa de SQLite (recrear tabla) sin ganancia real, porque el servidor ya garantiza el valor en toda escritura.
- **Filas antiguas**: la lista las muestra con la categoría de respaldo (`toPanelItems` no cambia); para guardar su edición hay que escribir un título (escenario 6 de la historia 2).
- **Efecto en pruebas de 003**: `validate.test.ts`, `create.test.ts`, `works-api.test.ts` y `new-page.test.ts` que publican sin título pasan a enviar uno; se añade el caso de título vacío.

## D6. Zona de foto accesible y táctil

- **Decisión**: un componente `PhotoDrop.astro` con un `<label for="photo" class="photo-drop">` que contiene el ícono, el texto y la vista previa; el `<input type="file">` queda dentro del `label`, visualmente oculto pero **no** con `display: none` (sigue enfocable por teclado). `:focus-within` dibuja el anillo de foco en el recuadro. Altura mínima de 44 px, en la práctica unos 160 px. Sin `capture`: el selector del sistema ya ofrece galería y cámara (003 D9).
- **Vista previa**: al elegir una foto, la imagen reemplaza al ícono y a "Toca para subir foto"; debajo se muestra "Cambiar foto" como texto más pequeño dentro del mismo `label`, para que siga siendo evidente que se puede cambiar. En edición empieza mostrando la foto actual (`md`) con ese mismo texto.
- **Motivo**: toda la zona es tocable por ser un `label` (FR-021); el control nativo conserva accesibilidad, foco y teclado sin código extra (FR-021, FR-022).
- **Alternativas**: botón + `input.click()` por script (más código y peor sin JS); `<input>` estilizado con `::file-selector-button` (no permite el diseño del mockup).

## D7. Ícono de cámara

- **Decisión**: un SVG propio inline (`CameraIcon.astro`) con `aria-hidden="true"` y `focusable="false"`, en `#3B1F14` (chocolate) o `#B8326E` según el contraste sobre el fondo; tamaño ~48 px como el mockup.
- **Motivo**: el emoji 📷 del mockup cambia de aspecto por sistema (Samsung, iOS, Windows) y a veces no se ve en fuentes de respaldo; el SVG se ve igual en todo celular (FR-023). Inline evita una petición y no necesita un archivo servido.
- **Alternativas**: el emoji (inconsistente); archivo `.svg` aparte (una petición más, sin ventaja).

## D8. Placeholders, asteriscos y opción inicial

- **Decisión**:
  - Título: `placeholder="Ej: Torta de Chocolate"`; descripción: `placeholder="Describe los ingredientes, tamaño, etc."`; primera opción del selector: `Selecciona una categoría` (valor vacío).
  - Asterisco: `<span class="required" aria-hidden="true">*</span>` en rojo `#A8142F` junto a la etiqueta (Foto, Categoría, Título) y `<span class="sr-only">(obligatorio)</span>` para lectores; los campos conservan `required`.
  - Etiquetas: "Título" pierde el "(opcional)" y "Descripción (opcional)" lo conserva. El mockup solo dice "Descripción", pero la spec la marca opcional y sin asterisco; el texto lo comunica sin depender del color.
- **Contraste del placeholder**: el color por defecto del navegador suele ser ~#757575 sobre blanco (4,6:1, en el límite). Se fija `::placeholder { color: #6B5A52 }` (≈6:1 sobre blanco), a verificar con Lighthouse y a mano.
- **Motivo**: FR-024 a FR-027. Los placeholders no sustituyen etiquetas (se conservan `<label>` visibles).

## D9. Diálogo de retiro

- **Decisión**: un solo `<dialog>` en la página de la lista (`RetireDialog.astro`) con `aria-labelledby` al título; cada botón "Retirar" tiene `data-work-id` y `data-work-title`. El script (`retire-dialog.ts`) guarda el botón origen, pone el `id` en el `form`, y llama a `dialog.showModal()`. El navegador atrapa el foco, cierra con Escape y devuelve el foco al elemento que lo abrió. "Cancelar" usa `dialog.close()`. El `::backdrop` oscurece el fondo y el resto queda inerte.
- **Envío**: el formulario del diálogo apunta a `/api/admin/works/{id}/retire`; el script lo envía con `fetch` y `Accept: application/json`. Éxito → `location.assign("/admin?retirado=1")`; error → mensaje dentro del diálogo, que sigue abierto para reintentar (FR-008). Mientras se envía, "Retirar" queda desactivado ("Retirando…").
- **Texto accesible**: el nombre del trabajo se anuncia dentro del texto del diálogo para quien no ve la tarjeta: "Dejará de verse en el catálogo público." se mantiene tal cual; el nombre va en una línea corta antes del texto. *(El mockup no lo muestra; añadir el título evita retirar la tarjeta equivocada. Se puede quitar sin otros cambios si se prefiere el mockup al pie de la letra.)*
- **Sin soporte de `<dialog>`** (navegadores muy viejos): si `showModal` no existe, el script usa `window.confirm("¿Retirar este trabajo? Dejará de verse en el catálogo público.")` antes de enviar; nunca se retira sin preguntar (edge case de la spec). Sin JavaScript, el botón "Retirar" es un `<button type=submit>` dentro de un formulario que envía directo al servidor: **este caso queda sin confirmación**, por lo que el botón solo se muestra cuando el script lo habilita (`hidden` por defecto, quitado al cargar). El formulario HTML + `303` queda como respaldo del propio diálogo, no como camino sin confirmar.
- **Alternativas**: biblioteca de modales (dependencia nueva, innecesaria); un diálogo por tarjeta (más HTML repetido); página de confirmación aparte (más pasos para algo que el mockup define como diálogo).

## D10. Avisos tras las acciones

- **Decisión**: igual que `?publicado=1` en 003: `/admin?retirado=1` ("Trabajo retirado."), `/admin?actualizado=1` ("Trabajo actualizado.") y `/admin?noDisponible=1` ("Ese trabajo ya no está disponible."), con `role="status"`. Solo se muestra uno a la vez (precedencia en ese orden si se combinaran parámetros).
- **Motivo**: sin estado de servidor ni cookies extra; consistente con lo ya construido. Recargar la página conserva el aviso, aceptable por ser informativo.

## D11. Página de edición para un trabajo no disponible

- **Decisión**: `/admin/works/{id}/edit` responde **404** con cabecera del panel, mensaje "Ese trabajo ya no está disponible." y botón "Volver a Mis trabajos" cuando el `id` no es un UUID, no existe o está retirado (FR-019). Falla de base → 503 como el resto.
- **Motivo**: un solo comportamiento para tres casos, sin revelar cuál fue.

## D12. Lista: botones y acceso

- **Decisión**: `WorkCard` añade debajo de la categoría dos botones de 44 px: "Editar" (enlace `<a>` a `/admin/works/{id}/edit`, estilo secundario) y "Retirar" (botón rojo `#A8142F`, fondo claro según el mockup). La tarjeta completa **no** es un enlace (el detalle no existe en esta spec). Los nombres accesibles incluyen el trabajo: `aria-label="Editar Torta de Chocolate"` y `aria-label="Retirar Torta de Chocolate"`.
- **Motivo**: sin los nombres accesibles, un lector de pantalla oiría "Editar, Editar, Editar" en la lista.

## D13. Riesgos y mediciones

- **R1 (CPU de `PUT` con foto)**: mismo perfil que el `POST` de 003 (T030 midió el valor real). Si el `PUT` excede 10 ms con una foto típica, se aplica la misma mitigación (una petición por archivo). Sin foto el `PUT` es trivial.
- **R3 (huérfanos de la versión anterior)**: ver D3.
- **R4 (ediciones simultáneas)**: la condición `photo_version = baseVersion` detecta el choque de fotos; para textos prevalece el último guardado, como dice la spec.
