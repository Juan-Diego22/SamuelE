---

description: "Lista de tareas para la funcionalidad 004: editar y retirar los trabajos del panel"
---

# Tasks: Editar y retirar los trabajos del panel

**Input**: Documentos de diseño en `/specs/004-editar-retirar-trabajos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-routes.md, quickstart.md

**Tests**: INCLUIDAS. La constitución (principio V) las exige para la lógica de negocio y los flujos críticos, y el plan enumera la estrategia de pruebas. Dentro de cada historia se escriben primero y deben fallar antes de implementar. Lo que no corre en Node (`<dialog>`, `canvas`, foco, tiempos) se verifica en celular real (Phase 6).

**Organization**: Tareas agrupadas por historia de usuario (US1 a US3). US1 (retirar) y US2 (editar) son ambas P1 y casi independientes entre sí; US3 (zona de foto y textos de ayuda) es P2 y retoca el formulario que US2 reutiliza, por eso va después de US2. El detalle de un trabajo no está en esta spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1, US2, US3)
- Todas las rutas son relativas a la raíz del repositorio

## Path Conventions

Proyecto único de Astro (ver plan.md, "Decisión de estructura"): lógica en `src/lib/works/` sin importar `cloudflare:workers` (recibe los almacenes por parámetro); solo las páginas y las rutas de API leen `env`. Pruebas en `tests/works/`, con almacenes en memoria (`createMemoryWorksStore`, `createMemoryMediaStore`) como en 003.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: ninguna dependencia ni binding nuevos (plan.md, Technical Context); solo se confirma la base de partida.

- [X] T001 Confirmar que `main` está al día en la rama `feature/004-editar-retirar-trabajos` y que `npm run lint`, `npm run check`, `npm run format:check` y `npm test` pasan antes de tocar nada (línea base de 003)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: esquema, almacenes, mensajes y la regla de título obligatorio, que usan las tres historias.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [X] T002 Añadir en `src/db/schema.ts` a la tabla `works` la columna `retiredAt: integer("retired_at")` **nula** ("`NULL` = activo. Milisegundos desde 1970 (UTC) del momento del retiro"), con un comentario igual al de data-model.md; sin índice (research D1) y sin cambiar las demás columnas
- [X] T003 Generar la migración con `npx drizzle-kit generate --name works_retired_at` como `migrations/0002_works_retired_at.sql` (debe contener solo `ALTER TABLE works ADD retired_at integer;`, sin valor por defecto), comprobar que `migrations/meta/` se actualizó y aplicarla en local con `npx wrangler d1 migrations apply samuele-reposteria --local`
- [X] T004 [P] Añadir en `src/lib/works/messages.ts` las claves de data-model.md, "Mensajes nuevos": `titleMissing` ("Escribe un título."), `notAvailable` ("Ese trabajo ya no está disponible."), `conflict` ("Este trabajo cambió. Recarga la página e inténtalo de nuevo."), `retireFailed` ("No pudimos retirar el trabajo. Intenta de nuevo.") y los avisos `retired` ("Trabajo retirado.") y `updated` ("Trabajo actualizado."); no tocar los mensajes existentes ni `ErrorField`
- [X] T005 [P] Escribir en `tests/works/validate.test.ts` los casos de título obligatorio (debe fallar antes de T006): título vacío y solo espacios → `{ field: "title", message: "Escribe un título." }`; título de 80 caracteres válido; de 81, "El título es muy largo (máximo 80 caracteres)."; descripción vacía sigue válida y se guarda como `null`
- [X] T006 Cambiar `validateFields` en `src/lib/works/validate.ts`: el título recortado **no puede estar vacío** (`MESSAGES.titleMissing`, `field: "title"`), sigue ≤`MAX_TITLE_LENGTH` (80) y devuelve `title: string`; la descripción sigue opcional (≤`MAX_DESCRIPTION_LENGTH`, 1000, `null` si queda vacía). Exportar también `validateEditFields(raw, store)` que hace lo mismo **sin** exigir ni validar `id` (viene de la ruta) y ajustar `ValidFields`/`RawFields` en consecuencia
- [X] T007 Actualizar las pruebas de 003 que publican sin título para que envíen uno y añadir en cada una el caso de título vacío: `tests/works/create.test.ts`, `tests/works/works-api.test.ts` (422 con `field: "title"`) y `tests/works/new-page.test.ts` si dependen de "Título (opcional)"; confirmar que `npm test -- tests/works/validate.test.ts tests/works/create.test.ts tests/works/works-api.test.ts` pasa
- [X] T008 Ampliar `WorksStore` y sus tres implementaciones en `src/lib/works/store.ts` (interfaz, `createD1WorksStore` y `createMemoryWorksStore`): `NewWork`/`ListedWork` suman `retiredAt: number | null` solo donde haga falta; `listWorks(limit)` **excluye** los retirados (`retired_at IS NULL`); `getWork(id)` devuelve el trabajo **activo** con su categoría o `null` (retirado e inexistente se tratan igual); `retireWork(id, now)` fija `retired_at = now` solo `WHERE id = ? AND retired_at IS NULL` y devuelve `"retired"` o `"not_found"`; `updateWork(id, patch, expectedPhotoVersion?)` actualiza `category_id`, `title` y `description` y, si `patch.photo` trae `{ version, ext }`, también `photo_version` y `photo_ext`, con `WHERE id = ? AND retired_at IS NULL` más `AND photo_version = expectedPhotoVersion` cuando se pasa, y devuelve `"updated"`, `"not_found"` o `"conflict"` (versión distinta); `created_at` **nunca** cambia. `workExists` sigue contando también los retirados
- [X] T009 [P] Escribir `tests/works/store-retire.test.ts` contra la versión en memoria (la de D1 se cubre con las pruebas de caso de uso y el quickstart): `listWorks` omite retirados; `getWork` devuelve `null` para retirado e inexistente; `retireWork` dos veces → `"retired"` y luego `"not_found"`; `updateWork` conserva `createdAt`, cambia solo los campos dados y devuelve `"conflict"` con `expectedPhotoVersion` distinta y `"not_found"` para un retirado
- [X] T010 [P] Ampliar `tests/works/list.test.ts` y `src/lib/works/list.ts`: `PanelItem` suma `editHref` (`/admin/works/{id}/edit`); la miniatura usa `row.photoVersion` en la URL; un trabajo sin título (fila antigua de 003) sigue mostrando la categoría como título; el orden por `createdAt` no cambia al editar

**Checkpoint**: base lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Retirar un trabajo con confirmación (Priority: P1) 🎯 MVP

**Goal**: cada tarjeta muestra "Editar" y "Retirar"; "Retirar" abre el diálogo "¿Retirar este trabajo?" y, al confirmar, el trabajo desaparece de la lista (borrado lógico).

**Independent Test**: con dos trabajos publicados, pulsar "Retirar", cancelar (sigue); volver a pulsar, confirmar (desaparece, también tras recargar y con el otro intacto). Se cubre con `retire.test.ts`, `retire-api.test.ts` y `admin-index.test.ts`; el diálogo (foco, Escape) en celular real.

### Tests for User Story 1 ⚠️ (escribirlas primero; deben fallar)

- [X] T011 [P] [US1] Escribir `tests/works/retire.test.ts` para `retireWork` de `src/lib/works/retire.ts`: éxito → `{ status: "retired" }` y el trabajo ya no sale en `listWorks`; id inexistente o ya retirado → `{ status: "not_available" }`; `id` que no es UUID → `not_available` sin consultar el almacén; almacén que lanza → `{ status: "unavailable" }` y el trabajo sigue en la lista; los archivos de R2 **no** se tocan (almacén de medios que falla si se llama `delete`)
- [X] T012 [P] [US1] Escribir `tests/works/retire-api.test.ts` para `handleRetireWork` (contrato `POST /api/admin/works/{id}/retire`): con `Accept: application/json` → 200 `{id}` / 404 con `{"error":{"field":"form","message":"Ese trabajo ya no está disponible."}}` / 503 con `retireFailed`; como formulario HTML → 303 a `/admin?retirado=1`, `/admin?noDisponible=1` o `/admin` (fallo); todas las respuestas con `Cache-Control: no-store`; cualquier método distinto de `POST` → 405 con `Allow`
- [X] T013 [P] [US1] Ampliar `tests/works/admin-index.test.ts` con `AstroContainer`: cada tarjeta tiene el enlace "Editar" (`href="/admin/works/{id}/edit"`) y el botón "Retirar" (`aria-label="Editar …"` / `aria-label="Retirar …"` con el nombre del trabajo); existe un solo `<dialog>` con `aria-labelledby`, el título "¿Retirar este trabajo?", el texto exacto "Dejará de verse en el catálogo público." y los botones "Cancelar" y "Retirar"; los avisos "Trabajo retirado." (`?retirado=1`), "Trabajo actualizado." (`?actualizado=1`) y "Ese trabajo ya no está disponible." (`?noDisponible=1`) con `role="status"`, mostrando solo uno según la precedencia del contrato; el estado vacío aparece al no quedar trabajos

### Implementation for User Story 1

- [X] T014 [US1] Crear `src/lib/works/retire.ts` con `retireWork({ worksStore, id, now, log })` → `{ status: "retired" | "not_available" | "unavailable" }`: valida `id` como UUID (reutilizar la expresión de `validate.ts`), llama a `worksStore.retireWork` y traduce el resultado; un fallo del almacén se registra con `log` y devuelve `unavailable`; no usa `MediaStore` (data-model.md: retirar no borra archivos)
- [X] T015 [US1] Añadir `handleRetireWork(request, id, deps)` a `src/lib/works/api.ts` según el contrato: JSON si `Accept` contiene `application/json`, si no redirección 303 (`/admin?retirado=1`, `/admin?noDisponible=1`, `/admin` ante fallo) con `Cache-Control: no-store`; reutilizar `json`/`fail` ya existentes
- [X] T016 [US1] Crear `src/pages/api/admin/works/[id]/retire.ts` (`prerender = false`) que exporta `POST` llamando a `handleRetireWork` con `createD1WorksStore(env.DB)`, `Date.now()` y `log` a `console.error`, y `ALL` que responde 405 con `Allow: POST` para otros métodos
- [X] T017 [P] [US1] Crear `src/components/RetireDialog.astro`: un `<dialog id="retire-dialog" aria-labelledby="retire-dialog-title">` con título "¿Retirar este trabajo?", una línea con el nombre del trabajo (vacía hasta que el script la llene), el texto "Dejará de verse en el catálogo público.", un `<p role="alert" hidden>` para errores y un `<form method="post">` con los botones "Cancelar" (`type="button"`) y "Retirar" (`type="submit"`, estilo destructivo); botones de ≥44 px
- [X] T018 [P] [US1] Crear `src/scripts/retire-dialog.ts`: al cargar, quita `hidden` de los botones `[data-retire]` (research D9); al pulsar uno guarda el botón de origen, rellena el nombre, fija `form.action = /api/admin/works/{id}/retire` y llama a `showModal()` (si no existe, usa `window.confirm("¿Retirar este trabajo? Dejará de verse en el catálogo público.")` y envía solo si acepta); "Cancelar" cierra con `close()`; el envío usa `fetch` con `Accept: application/json` y `credentials: "same-origin"`: 200 → `location.assign("/admin?retirado=1")`, 404 → `/admin?noDisponible=1`, 401 → `/admin/login`, otro error → mensaje de `retireFailed` dentro del diálogo, que sigue abierto; mientras envía, "Retirar" queda desactivado con el texto "Retirando…" y se evitan envíos duplicados
- [X] T019 [US1] Actualizar `src/components/WorkCard.astro` para añadir bajo la categoría el enlace "Editar" (`item.editHref`, estilo secundario) y el botón "Retirar" (`type="button"`, `hidden`, `data-retire`, `data-work-id`, `data-work-title`), ambos con `aria-label` que incluye `item.title` y de ≥44 px; la tarjeta completa no es un enlace
- [X] T020 [US1] Actualizar `src/components/WorksPanel.astro` y `src/pages/admin/index.astro`: incluir `RetireDialog` y cargar `retire-dialog.ts`; leer `?retirado=1`, `?actualizado=1` y `?noDisponible=1` (un solo aviso, en ese orden de precedencia, `role="status"`) y pasarlos como propiedades; conservar `?publicado=1` y el estado vacío
- [X] T021 [P] [US1] Añadir a `src/styles/global.css` los estilos de las acciones de tarjeta (botones "Editar" y "Retirar" de ≥44 px, "Retirar" en rojo `#A8142F` con texto de contraste ≥4,5:1 según el mockup `.btn-small-delete`) y del diálogo (`dialog`, `::backdrop` oscuro, botones "Cancelar" y "Retirar" como `.btn-cancel` / `.btn-confirm` del mockup, foco visible)
- [x] T022 [US1] Verificar `npm test -- tests/works/retire.test.ts tests/works/retire-api.test.ts tests/works/admin-index.test.ts` y `npm run check`; recorrer a mano la sección 5 de quickstart.md en el navegador de escritorio _(Estado: Automatizado verificado (retire.test, retire-api.test, admin-index.test, `npm run check` en verde); Recorrido manual de la sección 5 hecho en escritorio: pasos 1 a 8 conformes. Ajuste de diseño: el recuadro de error del diálogo quedaba pegado a los botones; se añadió margen en `.retire-dialog .form-error`.)_

**Checkpoint**: US1 funciona y se puede demostrar sola (retirar con confirmación)

---

## Phase 4: User Story 2 - Editar un trabajo publicado (Priority: P1)

**Goal**: "Editar" abre "Editar trabajo" precargado; se pueden cambiar categoría, título, descripción y foto; guardar vuelve a la lista con el aviso.

**Independent Test**: editar solo el título (la lista lo refleja, la foto y el lugar no cambian, sin subir archivos) y reemplazar la foto de otro (se ve la nueva, sin metadatos, URL con la versión nueva, versión vieja borrada). Se cubre con `update.test.ts`, `update-api.test.ts` y `edit-page.test.ts`.

### Tests for User Story 2 ⚠️ (escribirlas primero; deben fallar)

- [X] T023 [P] [US2] Escribir `tests/works/update.test.ts` para `updateWork` de `src/lib/works/update.ts`: (a) sin foto → solo cambia categoría/título/descripción, `created_at` y `photo_version` iguales, **cero** escrituras en `MediaStore`; (b) borrar la descripción la deja `null`; (c) título vacío o solo espacios → `invalid` con `field: "title"` y nada cambia; (d) con foto válida → R2 contiene las 4 claves de la versión `baseVersion + 1`, el trabajo pasa a esa versión y a la extensión nueva, y las 4 claves de la versión anterior (con **su** extensión) se borran después; (e) foto con EXIF/GPS en una derivada → `invalid` con `field: "photo"` y el trabajo conserva todo; (f) derivadas incompletas (falta `lg`) → `invalid` `photo`; (g) fallo en `put` de R2 a mitad → se borra lo escrito, el trabajo conserva foto y datos anteriores, `unavailable`; (h) fallo de D1 al actualizar → se borra la versión nueva y la anterior sigue; (i) mismo guardado repetido (`photoVersion === baseVersion + 1`) → éxito sin escribir; (j) `baseVersion` distinta → `conflict` y lo escrito se deshace; (k) trabajo retirado o inexistente → `not_available`; (l) el borrado de la versión anterior falla → sigue siendo éxito y se registra con `log`
- [X] T024 [P] [US2] Escribir `tests/works/update-api.test.ts` para `handleUpdateWork` (contrato `PUT /api/admin/works/{id}`): 200 `{id, photoVersion}` con y sin foto; 422 con el campo correcto (`title`, `category`, `photo`); 404 con el mensaje "Ese trabajo ya no está disponible." para inexistente, retirado o `id` no UUID; 409 con `conflict`; 400 si no es multipart; 413 si `Content-Length` supera `MAX_BODY_BYTES`; 503 ante fallo de R2 o D1; `Cache-Control: no-store`; método distinto de `PUT` → 405 con `Allow`
- [X] T025 [P] [US2] Escribir `tests/works/edit-page.test.ts` con `AstroContainer` para `src/pages/admin/works/[id]/edit.astro`: trabajo activo → 200 con título "Editar trabajo", categoría seleccionada, título y descripción precargados, la foto actual en la vista previa (URL `…/md.{ext}` con su versión), `data-work-id`, `data-photo-version` y el botón "Guardar" (no "Publicar"); `id` inexistente, retirado o no UUID → 404 con "Ese trabajo ya no está disponible." y "Volver a Mis trabajos"; fallo de base → 503; el texto con `<script>` se escapa

### Implementation for User Story 2

- [X] T026 [US2] Crear `src/lib/works/update.ts` con `updateWork({ worksStore, mediaStore, id, baseVersion, fields, original, derivatives, now, log })` → `{ status: "updated"; photoVersion } | { status: "invalid"; field; message } | { status: "not_available" } | { status: "conflict" } | { status: "unavailable" }`, siguiendo research D3 y D4: valida con `validateEditFields`; "todos o ninguno" para `original`/`sm`/`md`/`lg` (incompleto → `invalid` `photo`, `MESSAGES.derivativesInvalid`); sin foto, solo `worksStore.updateWork` sin tocar R2; con foto, reutilizar `validateOriginal`/`validateDerivatives` de `media.ts` y las claves de `keys.ts` con la versión `baseVersion + 1`; escribir R2 → `updateWork` condicional a `baseVersion` → solo entonces borrar las claves de la versión anterior calculadas con la extensión **guardada antes** de actualizar; deshacer lo escrito ante cualquier fallo; el borrado de lo viejo es de mejor esfuerzo y se registra con `log`
- [X] T027 [US2] Añadir `handleUpdateWork(request, id, deps)` a `src/lib/works/api.ts` (comparte con `handleCreateWork` la comprobación de `Content-Type`, el tope `MAX_BODY_BYTES` y la lectura de `formData`; extraer los ayudantes comunes en lugar de duplicarlos): campos `category`, `title`, `description`, `baseVersion` y archivos opcionales; respuestas según el contrato (200/404/409/413/422/400/503)
- [X] T028 [US2] Crear `src/pages/api/admin/works/[id].ts` (`prerender = false`) con `PUT` que llama a `handleUpdateWork` con `createD1WorksStore(env.DB)`, `createR2MediaStore(env.MEDIA)`, `Date.now()` y `log`; `ALL` que responde 405 con `Allow: PUT` para otros métodos
- [X] T029 [P] [US2] Crear `src/lib/works/edit-view.ts` con `toEditValues(work)` → `{ id, categoryId, title, description, photoVersion, photoUrl }` (la URL `md` con la versión, vía `mediaUrl`) para precargar el formulario, y una prueba mínima en `tests/works/edit-page.test.ts` si conviene
- [X] T030 [US2] Hacer que `src/components/WorkForm.astro` acepte la propiedad opcional `work` (de `toEditValues`): con ella precarga categoría, título, descripción y la vista previa con `photoUrl`, expone `data-mode="edit"`, `data-work-id` y `data-photo-version` en el `<form>`, y el botón dice "Guardar" en lugar de "Publicar"; sin ella el comportamiento actual de "Nuevo" no cambia; la etiqueta "Título" deja de decir "(opcional)" y el campo conserva `required` y `maxlength` de `MAX_TITLE_LENGTH`
- [X] T031 [US2] Crear `src/components/EditWorkView.astro` (cabecera `PanelHeader` con "Editar trabajo", `WorkForm` con `work`, o el estado "no disponible" con "Volver a Mis trabajos") y `src/pages/admin/works/[id]/edit.astro` (`prerender = false`): valida `id` como UUID, `getWork`, categorías de D1; no existe/retirado/no UUID → `Astro.response.status = 404`; falla de base → 503 con `MESSAGES.formUnavailable`
- [X] T032 [US2] Adaptar `src/scripts/work-form.ts` al modo edición sin romper "Nuevo": en edición la foto es **opcional** (no se muestra "Elige una foto." si no se eligió una nueva) y solo si hay archivo nuevo se llama a `optimizePhoto` y se adjuntan `original`, `sm`, `md`, `lg` junto con `baseVersion` (`data-photo-version`); se envía `PUT /api/admin/works/{id}` y, con 200, `location.assign("/admin?actualizado=1")`; 404 → `/admin?noDisponible=1`; 409/422/503 se muestran junto al campo o en el error de formulario conservando todo lo escrito; el texto del botón ocupado es "Guardando…"; el título vacío (o solo espacios) en cliente muestra `MESSAGES.titleMissing` junto al campo antes de enviar, también al publicar; el `id` nuevo por foto elegida solo aplica a "Nuevo"
- [x] T033 [US2] Verificar `npm test` completo y `npm run check`; recorrer a mano la sección 4 de quickstart.md (editar solo el título, reemplazar la foto, versión vieja borrada, conflicto entre pestañas, fallo de red) _(Estado: Automatizado verificado (`npm test` completo y `npm run check` en verde); Recorrido manual de la sección 4: pasos 1 a 8 y 10 conformes; pasos 5 y 6 comprobados leyendo R2 local (derivadas 400/900/1600 de ancho, sin EXIF/GPS/XMP; solo existe la versión vigente). El paso 9 reveló un fallo: otra pestaña con la versión avanzada en 1 se tomaba como reintento y devolvía éxito sin guardar. Corregido en `updateWork` (compara la `sm` guardada con la recibida; si difiere, `conflict`) con prueba nueva. Paso 9 repetido en el navegador tras la corrección: la segunda pestaña recibe "Este trabajo cambió. Recarga la página…".)_

**Checkpoint**: US1 y US2 funcionan; la administradora ya puede corregir y retirar

---

## Phase 5: User Story 3 - Zona de foto y textos de ayuda en el formulario (Priority: P2)

**Goal**: el formulario (nuevo y edición) se ve como el mockup "Panel: Nuevo": zona de foto con cámara, placeholders, "Selecciona una categoría" y asteriscos rojos.

**Independent Test**: abrir "Nuevo trabajo" en un celular y comparar con el mockup: toda la zona es tocable y abre galería/cámara; al elegir foto se ve la vista previa y se puede cambiar; asteriscos solo en Foto, Categoría y Título.

### Tests for User Story 3 ⚠️ (escribirlas primero; deben fallar)

- [X] T034 [P] [US3] Ampliar `tests/works/new-page.test.ts` con `AstroContainer`: existe `label.photo-drop` que contiene el `input#photo` (`type="file"`, `accept="image/jpeg,image/png,image/webp"`, sin `capture`), un SVG con `aria-hidden="true"`, el texto "Toca para subir foto" y "Galería o cámara"; `placeholder="Ej: Torta de Chocolate"` en el título y `placeholder="Describe los ingredientes, tamaño, etc."` en la descripción; la primera opción del selector es "Selecciona una categoría" con valor vacío, seguida de Tortas, Postres, Rollos y Otros; asteriscos (`.required[aria-hidden="true"]`) y texto `sr-only` "(obligatorio)" en Foto, Categoría y Título y **no** en Descripción, cuya etiqueta dice "Descripción (opcional)"; las cuatro etiquetas siguen asociadas a su campo por `for`/`id`; los contenedores de error (`role="alert"`) se conservan
- [X] T035 [P] [US3] Añadir las mismas comprobaciones de la zona de foto, placeholders, opción inicial y asteriscos al render de edición en `tests/works/edit-page.test.ts` (con la foto actual en la vista previa en vez del ícono)

### Implementation for User Story 3

- [X] T036 [P] [US3] Crear `src/components/CameraIcon.astro`: SVG inline de cámara (~48 px, `aria-hidden="true"`, `focusable="false"`, trazo/relleno `currentColor`), con el color del recuadro definido en CSS para contraste ≥3:1 sobre el fondo (research D7)
- [X] T037 [US3] Crear `src/components/PhotoDrop.astro`: `<label for="photo" class="photo-drop">` que contiene el `input#photo` (visualmente oculto pero enfocable, **no** `display: none`; conservar `name`, `accept`, `required` y `aria-describedby="error-photo"` actuales), `CameraIcon`, "Toca para subir foto" y debajo "Galería o cámara" (más pequeño), la imagen `#photo-preview` (`hidden`, alt "Vista previa de la foto elegida") y un texto "Cambiar foto" que se muestra junto a la vista previa; con la propiedad `currentPhotoUrl` (edición) empieza mostrando la foto actual con "Cambiar foto"; alto mínimo ≥44 px (en la práctica ~160 px) y `:focus-within` con anillo de foco visible; mantener el párrafo de error `#error-photo` con `data-error-for="photo"`
- [X] T038 [US3] Actualizar `src/components/WorkForm.astro` para usar `PhotoDrop`, la etiqueta "Foto" con asterisco (`<span class="required" aria-hidden="true">*</span><span class="sr-only"> (obligatorio)</span>`), lo mismo en Categoría y Título; `placeholder` del título y de la descripción exactos; primera opción `<option value="">Selecciona una categoría</option>` (reemplaza "Elige una categoría"); etiqueta "Descripción (opcional)" sin asterisco
- [X] T039 [US3] Ajustar `src/scripts/work-form.ts` a la nueva zona: al elegir una foto, la vista previa reemplaza al ícono y a los textos (clase de estado en `.photo-drop`, p. ej. `has-photo`) y aparece "Cambiar foto"; al cancelar el selector sin elegir, vuelve al estado anterior; sin cambiar la lógica de validación, optimización ni envío
- [X] T040 [US3] Añadir a `src/styles/global.css`: `.photo-drop` (borde `2px dashed #C9A24B`, radio 8 px, relleno 24 px, texto centrado, fondo claro del mockup, `:active` con el tono pulsado, `:focus-within` con anillo visible), `.photo-drop-icon`, `.photo-drop-text` (14 px, `#3B1F14`, peso 500) y `.photo-drop-hint` (12 px, contraste ≥4,5:1), `.required` (rojo `#A8142F`), `.sr-only`, `::placeholder { color: #6B5A52 }` (≥4,5:1 sobre blanco, research D8) y la vista previa dentro de la zona (`object-fit: cover`, sin desbordar); retirar las reglas de `.photo-upload` que dejen de usarse
- [x] T041 [US3] Verificar `npm test`, `npm run check`, `npm run lint` y `npm run format:check`; recorrer a mano la sección 3 de quickstart.md y comparar con `docs/design/mockups.html` ("Panel: Nuevo") en una ventana de 390 px de ancho _(Estado: Automatizado verificado (`npm test`, `check`, `lint` y `format:check` en verde); Recorrido manual de la sección 3 hecho en escritorio con ventana de 390 px y comparado con el mockup "Panel: Nuevo": pasos 1 a 6 conformes. Automatizado repetido tras los cambios de T022 y T033 (tests, check, lint y format:check en verde).)_

**Checkpoint**: las tres historias funcionan

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: documentación, comprobaciones en dispositivo real y cierre en producción

- [X] T042 [P] Actualizar `README.md` con las funciones nuevas (editar, retirar, título obligatorio), la ruta `/admin/works/{id}/edit`, las dos rutas de API y la migración `0002`; añadir en `docs/adr/0005-optimizacion-de-imagenes.md` una nota sobre el reemplazo de foto (versión nueva, borrado de la anterior al confirmar, URL versionada que evita el caché) y marcar en `docs/design/mockups.md` los elementos ya implementados de las pantallas 4 y 5 (botones, diálogo, zona de foto)
- [X] T043 [P] Actualizar `specs/003-panel-nuevo-trabajo/spec.md` (Assumptions): anotar que "título opcional" y "Editar y Retirar fuera de alcance" quedan reemplazados por la spec 004, para que no se contradigan
- [X] T044 Ejecutar `npm run lint`, `npm run check`, `npm run format:check`, `npm test` y `npm run build`; todo en verde
- [ ] T045 Prueba en celular real (quickstart.md, secciones 3, 4, 5 y 6): diálogo con foco atrapado y Escape; retirar en <10 s (SC-001); corregir título/categoría en <30 s y reemplazar foto en <1 min (SC-004); comparar zona de foto, placeholders y asteriscos lado a lado con el mockup (SC-009); foto con GPS y en vertical sin metadatos y derecha (SC-005); anotar los resultados en este archivo
- [ ] T046 Medir Lighthouse móvil en `/admin`, `/admin/works/new` y `/admin/works/<id>/edit` (con sesión) y el contraste de placeholders, asterisco y botón "Retirar" (SC-010); guardar los reportes en `lhci-reports/` como en 003 y corregir lo que baje de 90 o de 4,5:1
- [ ] T047 Abrir el PR contra `main` (Conventional Commits en inglés con ámbito y `Refs: HU-09, HU-10`, referenciar ADR 0004 y 0005 en la descripción), esperar CI en verde, fusionar con squash y comprobar que el despliegue aplicó la migración `0002`
- [ ] T048 Tras desplegar, con la administradora real: comprobar que encuentra y usa "Editar" y "Retirar" sin ayuda (SC-008) y medir en Cloudflare el CPU de `PUT /api/admin/works/{id}` (con y sin foto) y de `POST …/retire`, esperado ≤10 ms (riesgo R1); si el `PUT` con foto lo excede, aplicar la mitigación de 003 research D2 y documentarlo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; **bloquea** todas las historias. Orden interno: T002 → T003; T004 en paralelo; T005 → T006 → T007; T008 tras T002 y T006 (usa `ValidFields`); T009 y T010 tras T008
- **US1 (Phase 3)**: tras Foundational. No depende de US2 ni de US3
- **US2 (Phase 4)**: tras Foundational. Independiente de US1 salvo que `WorkCard` (T019) ya enlaza a la página de edición y T020 muestra el aviso `?actualizado=1`
- **US3 (Phase 5)**: tras US2 (rediseña `WorkForm.astro`, `work-form.ts` y `global.css`, que US2 modifica)
- **Polish (Phase 6)**: tras las historias deseadas. Orden obligado al final: T044 → T045 y T046 → T047 → T048

### User Story Dependencies

- **US1 (P1)**: arranca tras Foundational; MVP
- **US2 (P1)**: arranca tras Foundational; puede avanzar en paralelo con US1 (archivos distintos salvo `api.ts` y `global.css`: coordinar T015/T027 y T021/T040)
- **US3 (P2)**: arranca cuando US2 termina T030–T032 (mismos archivos de formulario)

### Within Each User Story

- Pruebas primero y deben fallar; después casos de uso, manejadores, rutas, componentes y script
- `src/lib/works/` antes de rutas y páginas; rutas antes de los scripts de cliente que las llaman

### Parallel Opportunities

- Foundational: T004 en paralelo con T002/T003; T009 y T010 juntas
- US1: T011 a T013 juntas; T017, T018 y T021 en paralelo
- US2: T023 a T025 juntas; T029 en paralelo con T026 a T028
- US3: T034 y T035 juntas; T036 en paralelo con T034/T035
- Polish: T042 y T043 en paralelo

---

## Parallel Example: User Story 1

```text
# Pruebas de US1 juntas:
T011 tests/works/retire.test.ts
T012 tests/works/retire-api.test.ts
T013 tests/works/admin-index.test.ts

# Piezas de interfaz de US1 juntas (archivos distintos):
T017 src/components/RetireDialog.astro
T018 src/scripts/retire-dialog.ts
T021 src/styles/global.css
```

---

## Implementation Strategy

### MVP First

1. Setup + Foundational (T001 a T010): migración, almacenes y título obligatorio
2. US1 (T011 a T022): **retirar con confirmación**; ya se puede demostrar y es lo de mayor riesgo para la administradora
3. Validar US1 y seguir

### Incremental Delivery

1. Foundational → base
2. US1 → retirar → demo
3. US2 → editar (con reemplazo de foto) → demo
4. US3 → zona de foto, placeholders y asteriscos → comparar con el mockup en celular
5. Polish → celular real, Lighthouse, PR, despliegue y medición de CPU

### Notas

- Cada tarea debe terminar con `npm test` y `npm run check` en verde para lo que toca
- Todos los textos visibles, en español y exactos a la spec y a los mockups
- Las pruebas de 003 que publicaban sin título se actualizan en T007; no deben quedar pruebas que dependan de "Título (opcional)"
- Commits en inglés (Conventional Commits) con `Refs: HU-09` o `HU-10`; una rama por cambio, PR a `main`
