---

description: "Lista de tareas para la funcionalidad 003: panel de trabajos y creación de trabajos"
---

# Tasks: Panel de trabajos y creación de trabajos

**Input**: Documentos de diseño en `/specs/003-panel-nuevo-trabajo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-routes.md, quickstart.md

**Tests**: INCLUIDAS. La constitución (principio V) las exige para la lógica de negocio y los flujos críticos, y el plan enumera la estrategia de pruebas. Dentro de cada historia se escriben primero y deben fallar antes de implementar.

**Organization**: Tareas agrupadas por historia de usuario (US1 a US4). **Nota de orden**: US1 y US2 son ambas P1 y están acopladas: publicar un trabajo (US1) necesita la validación y optimización de la foto (US2). Por eso la fase de US2 va primero y US1 depende de ella. El MVP es US2 + US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1, US2, US3, US4)
- Todas las rutas son relativas a la raíz del repositorio

## Path Conventions

Proyecto único de Astro (ver plan.md, "Decisión de estructura"): lógica en `src/lib/works/` y `src/lib/photo/` sin importar `cloudflare:workers` (reciben los almacenes por parámetro); solo el middleware, las páginas y las rutas leen `env`. Pruebas en `tests/works/`. Código e identificadores en inglés; comentarios, textos de interfaz y documentación en español.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: binding de R2 y tipos del entorno

- [X] T001 Añadir a `wrangler.jsonc` el binding `r2_buckets: [{ "binding": "MEDIA", "bucket_name": "samuele-media" }]` con un comentario que indique que el bucket se crea una vez en la cuenta (ADR 0004; requisito previo de producción en plan.md y research D11). **Requisito previo antes de fusionar**: el despliegue corre al fusionar a `main` y falla si `samuele-media` no existe; ver T042
- [X] T002 [P] Tipar el nuevo binding en `src/env.d.ts` (`MEDIA: R2Bucket` dentro de `Cloudflare.Env`) y regenerar `worker-configuration.d.ts` con `npx wrangler types` si el repositorio lo versiona

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: esquema, constantes, claves y almacenes que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [X] T003 Definir en `src/db/schema.ts` (Drizzle) las tablas de data-model.md. `categories`: `id` entero clave primaria; `name` texto no nulo único; `position` entero no nulo. `works`: `id` texto clave primaria ("UUID generado por el navegador"); `category_id` entero no nulo referencia `categories.id`; `title` texto nulo ("≤80 caracteres"); `description` texto nulo ("≤1000 caracteres"); `photo_version` entero no nulo; `photo_ext` texto no nulo ("`webp` o `jpg`"); `created_at` entero no nulo (milisegundos Unix UTC). Índices `works_created_at_idx` sobre `created_at` y `works_category_id_idx` sobre `category_id`. Comentarios en español
- [X] T004 Generar la migración con `npx drizzle-kit generate --name categories_and_works` como `migrations/0001_categories_and_works.sql`, añadir al final los `INSERT` de las 4 categorías (`id` 1 Tortas, 2 Postres, 3 Rollos, 4 Otros, `position` igual al `id`) y aplicarla en local con `npx wrangler d1 migrations apply DB --local`; comprobar con `SELECT id, name FROM categories ORDER BY position` (depende de T003)
- [X] T005 [P] Crear `src/lib/works/limits.ts` con las constantes exportadas: `MAX_ORIGINAL_BYTES = 15 * 1024 * 1024`, `MAX_DERIVATIVE_BYTES = 1024 * 1024`, `MAX_TITLE_LENGTH = 80`, `MAX_DESCRIPTION_LENGTH = 1000`, `LIST_LIMIT = 200`, `DERIVATIVE_WIDTHS = { sm: 400, md: 900, lg: 1600 }` y `PHOTO_QUALITY = 0.8`
- [X] T006 [P] Crear `src/lib/works/keys.ts` con `originalKey(id, version)` → `originals/{id}-{version}.jpg`, `derivativeKey(id, version, size, ext)` → `works/{id}-{version}/{sm|md|lg}.{ext}` y `mediaUrl(id, version, size, ext)` → `/media/works/{id}-{version}/{size}.{ext}` (research D6, ADR 0004)
- [X] T007 [P] Escribir `tests/works/keys.test.ts` con las claves y la URL de ejemplo para `webp` y `jpg` (debe fallar antes de T006)
- [X] T008 [P] Crear `src/lib/works/messages.ts` con los mensajes en español de la tabla de validaciones de data-model.md: categoría faltante ("Elige una categoría."), foto faltante ("Elige una foto."), título largo ("El título es muy largo (máximo 80 caracteres)."), descripción larga ("La descripción es muy larga (máximo 1000 caracteres)."), foto pesada ("La foto pesa demasiado (máximo 15 MB)."), formato no admitido ("Esa foto no tiene un formato admitido. Usa JPEG, PNG o WebP."), derivadas inválidas ("No pudimos preparar la foto. Intenta con otra."), y error de guardado ("No pudimos guardar el trabajo. Intenta de nuevo.")
- [X] T009 Definir en `src/lib/works/store.ts` las interfaces `WorksStore` (`listCategories()`, `categoryExists(id)`, `insertWork(work)` que devuelve `"created"` o `"duplicate"` ante clave primaria repetida, `listWorks(limit)` con la categoría unida, ordenada por `created_at` descendente) y `MediaStore` (`put(key, bytes, contentType)`, `get(key)`, `delete(keys)`), sus implementaciones `createD1WorksStore(db)` (Drizzle) y `createR2MediaStore(bucket)`, y versiones en memoria `createMemoryWorksStore()` y `createMemoryMediaStore()` con interruptores para forzar fallos en una operación concreta (depende de T003, T005)

**Checkpoint**: base lista; las historias pueden empezar

---

## Phase 3: User Story 2 - Foto optimizada automáticamente y sin datos sensibles (Priority: P1) 🎯 MVP

**Goal**: aceptar solo imágenes válidas, generar miniatura, mediana y grande con la orientación corregida y sin metadatos, y que el servidor lo verifique.

**Independent Test**: las pruebas de `media.test.ts` y `photo-plan.test.ts` pasan; en el navegador, `optimizePhoto` convierte una foto de celular con GPS en tres versiones sin metadatos (se comprueba de punta a punta en US1).

### Tests for User Story 2 ⚠️

> Escribirlas primero y comprobar que fallan

- [X] T010 [P] [US2] Escribir `tests/works/media.test.ts`: `sniffImageType` reconoce JPEG, PNG y WebP por bytes y devuelve `null` para PDF, HEIC (`ftyp`) y un `.txt` con extensión de imagen; `hasMetadata` detecta un JPEG con segmento APP1 (EXIF con GPS) y un WebP con bloque `EXIF` o `XMP `, y acepta un JPEG y un WebP limpios; `validateOriginal` rechaza más de 15 MB y tipos no admitidos con los mensajes de T008; `validateDerivatives` exige las tres, cada una ≤1 MB, WebP o JPEG del mismo tipo entre sí y sin metadatos. Construir los archivos de prueba como `Uint8Array` dentro del test
- [X] T011 [P] [US2] Escribir `tests/works/photo-plan.test.ts`: `planDerivatives(width, height, supportsWebp)` devuelve anchos 400, 900 y 1600, **nunca mayores al ancho original** (una foto de 700 px de ancho no se agranda), conserva la proporción, y elige `webp` si el navegador lo soporta o `jpg` si no

### Implementation for User Story 2

- [X] T012 [US2] Implementar `src/lib/works/media.ts`: `sniffImageType(bytes)` (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`), `hasMetadata(bytes, type)` (recorre solo la cabecera: en JPEG los marcadores APP1 `FF E1` y APP13 `FF ED`; en WebP los bloques `EXIF` y `XMP `), `validateOriginal(bytes)` y `validateDerivatives({ sm, md, lg })` devolviendo `{ ok: true, ext } | { ok: false, field, message }` (research D4; depende de T005, T008)
- [X] T013 [P] [US2] Implementar `src/lib/photo/plan.ts` con `planDerivatives` (puro, sin DOM) usando `DERIVATIVE_WIDTHS` de `src/lib/works/limits.ts` (depende de T005)
- [X] T014 [US2] Implementar `src/lib/photo/optimize.ts` (solo navegador): `optimizePhoto(file)` decodifica con `createImageBitmap(file, { imageOrientation: "from-image" })`, dibuja cada ancho de `planDerivatives` en un canvas, codifica con `toBlob` en WebP y, si el tipo devuelto no es `image/webp`, repite en JPEG con `PHOTO_QUALITY`; devuelve `{ sm, md, lg, ext }`; si la imagen no se puede decodificar, lanza un error con el mensaje "formato no admitido" de T008 (research D9; depende de T013)

**Checkpoint**: el servidor sabe validar fotos y el navegador sabe prepararlas

---

## Phase 4: User Story 1 - Publicar un trabajo nuevo con foto y categoría (Priority: P1) 🎯 MVP

**Goal**: la administradora abre el formulario, elige foto y categoría, publica y el trabajo queda guardado.

**Independent Test**: con sesión, publicar un trabajo con solo foto y categoría y otro completo; el trabajo existe en D1 y sus cuatro archivos en R2; sin foto o sin categoría no se guarda nada y el mensaje indica el campo (quickstart §3 pasos 3 a 7).

### Tests for User Story 1 ⚠️

- [X] T015 [P] [US1] Escribir `tests/works/validate.test.ts`: `validateFields({ id, category, title, description })` exige `id` con formato UUID, `category` entero que exista, recorta `title` y `description` y guarda nulo si quedan vacíos, rechaza "≤80 caracteres" de título y "≤1000 caracteres" de descripción excedidos con los mensajes de T008, y conserva `<script>` como texto sin alterarlo
- [X] T016 [P] [US1] Escribir `tests/works/create.test.ts` con almacenes en memoria: crea el trabajo y escribe R2 antes que D1; con solo foto y categoría funciona; si falla una escritura de R2 se borran las ya escritas y no queda fila en D1; si falla D1 se borran las cuatro claves de R2; un segundo envío con el mismo `id` devuelve éxito sin escribir de nuevo (FR-016); la fila guarda `photo_version` 1, `photo_ext` y `created_at` (depende de T009)
- [X] T017 [P] [US1] Escribir `tests/works/works-api.test.ts` para `POST /api/admin/works` según contracts/http-routes.md: 201 con `{ "id" }`, 422 con `{ error: { field, message } }` para cada campo inválido, 413 o 400 para cuerpo no `multipart/form-data` o excesivo, 503 si falla R2 o D1, 401 sin sesión y 403 con `Origin` ajeno o ausente (usa el middleware existente de `src/lib/auth/guard.ts`), 413 cuando `Content-Length` supera el tope sin leer el cuerpo, y, con `guardRequest`, que `GET /admin/works/new` sin sesión redirige (303) a `/admin/login` y `POST /api/admin/works` sin sesión responde 401 (FR-019, SC-009)
- [X] T018 [P] [US1] Escribir `tests/works/new-page.test.ts` con `AstroContainer`: la página muestra título "Nuevo trabajo", campo de foto con `accept="image/jpeg,image/png,image/webp"`, las 4 categorías, título y descripción opcionales, el botón "Publicar" y el aviso `<noscript>`; con falla de base responde 503 con enlace a `/admin`

### Implementation for User Story 1

- [X] T019 [US1] Implementar `src/lib/works/validate.ts` con `validateFields` (T015), usando `MAX_TITLE_LENGTH` y `MAX_DESCRIPTION_LENGTH` de `src/lib/works/limits.ts` y los mensajes de `src/lib/works/messages.ts` (depende de T005, T008)
- [X] T020 [US1] Implementar `src/lib/works/create.ts`: `createWork({ worksStore, mediaStore, fields, original, derivatives, now })` que valida campos y fotos (`validateFields`, `validateOriginal`, `validateDerivatives`), comprueba la categoría, escribe en R2 (original y las tres derivadas con sus claves de `keys.ts`), inserta en D1 al final y deshace R2 si algo falla (research D5; depende de T006, T009, T012, T019)
- [X] T021 [US1] Crear `src/pages/api/admin/works.ts` (`prerender = false`, `POST`): **antes de leer el cuerpo**, comprueba `Content-Length` contra un tope de `MAX_ORIGINAL_BYTES + 3 * MAX_DERIVATIVE_BYTES` más un margen de 64 KB para campos y cabeceras y responde 413 sin invocar `request.formData()` (ahorra CPU, riesgo R1); si pasa, lee `request.formData()`, arma los `Uint8Array` de `original`, `sm`, `md` y `lg`, llama a `createWork` con `createD1WorksStore(env.DB)` y `createR2MediaStore(env.MEDIA)` y responde según contracts/http-routes.md (201, 422, 400/413, 503); registra en el log del Worker los fallos de limpieza (depende de T020)
- [X] T022 [P] [US1] Crear `src/components/PanelHeader.astro` (logo pequeño, título recibido por `Props`, botón "Salir" que envía `POST /api/admin/logout`), reutilizando el estilo de `src/components/BrandHeader.astro` y el mockup 4/5; sin duplicar la barra provisional de `src/pages/admin/index.astro`
- [X] T023 [P] [US1] Crear `src/components/WorkForm.astro`: campo de foto (`<input type="file" accept="image/jpeg,image/png,image/webp">` sin `capture`, para ofrecer galería y cámara), vista previa con texto alternativo, `<select>` de categoría recibido por `Props` con `required`, campos de título y descripción con `maxlength` de 80 y 1000, botón "Publicar", contenedor de errores con `role="alert"` y `<noscript>` ("Necesitas activar JavaScript para publicar fotos."). Campos y botón ≥48 px, etiquetas asociadas
- [X] T024 [US1] Crear `src/pages/admin/works/new.astro` (`prerender = false`): lee las categorías con `createD1WorksStore(env.DB).listCategories()`, muestra `PanelHeader` con "Nuevo trabajo" y `WorkForm`; si la base falla, responde 503 con mensaje sencillo y enlace a `/admin` (depende de T009, T022, T023)
- [X] T025 [US1] Crear `src/scripts/work-form.ts` e incluirlo en `WorkForm.astro`: muestra la vista previa con `URL.createObjectURL`, valida foto y categoría antes de enviar (mensaje junto al campo), llama a `optimizePhoto` de `src/lib/photo/optimize.ts`, genera `id` con `crypto.randomUUID()`, arma el `FormData` (`id`, `category`, `title`, `description`, `original`, `sm`, `md`, `lg`), lo envía con `fetch` a `/api/admin/works` y, con 201, redirige a `/admin?publicado=1` (depende de T014, T021, T023)
- [X] T026 [P] [US1] Añadir a `src/styles/global.css` los estilos del formulario y la cabecera del panel según los mockups 4 y 5: zona de foto (`.photo-upload`), vista previa, grupos de formulario, botón "Publicar", paleta y tipografía de `docs/design/mockups.md` (contraste ≥4.5:1, texto ≥16 px)

**Checkpoint**: se puede publicar un trabajo completo desde el celular; US1 + US2 forman el MVP

---

## Phase 5: User Story 3 - Ver la lista de "Mis trabajos" (Priority: P2)

**Goal**: el panel muestra los trabajos publicados con miniatura, título y categoría, y un mensaje cuando no hay ninguno.

**Independent Test**: sin trabajos se ve el mensaje de lista vacía; con dos trabajos se ven ambos, el más reciente primero, y la miniatura carga desde `/media/...` (quickstart §3 pasos 2, 5 y 6).

### Tests for User Story 3 ⚠️

- [X] T027 [P] [US3] Escribir `tests/works/list.test.ts`: `toPanelItems(rows)` ordena del más reciente al más antiguo, usa la categoría como título cuando el trabajo no tiene título (FR-002) y arma la URL de miniatura con `mediaUrl`
- [X] T028 [P] [US3] Escribir `tests/works/admin-index.test.ts` con `AstroContainer`: lista vacía → mensaje "Todavía no tienes trabajos. Publica el primero." y botón "+ Nuevo trabajo"; con trabajos → una tarjeta por trabajo con `<img>` con texto alternativo; título con `<script>alert(1)</script>` se renderiza escapado; `?publicado=1` muestra "Trabajo publicado." con `role="status"`; falla de base → 503 con "No pudimos cargar tus trabajos. Intenta de nuevo en unos minutos." y el botón sigue visible; no aparecen "Editar" ni "Retirar"
- [X] T029 [P] [US3] Escribir `tests/works/media-route.test.ts`: una derivada existente responde 200 con `Content-Type` correcto y `Cache-Control: public, max-age=31536000, immutable`; ruta inexistente → 404; rutas con `originals/` o que no cumplen la forma `works/{id}-{version}/{sm|md|lg}.{webp|jpg}` → 404 sin consultar R2; método distinto de `GET` y `HEAD` → 405; fallo de R2 → 502

### Implementation for User Story 3

- [X] T030 [US3] Implementar `src/lib/works/list.ts` con `toPanelItems(rows)` (T027), usando `mediaUrl` de `src/lib/works/keys.ts` (depende de T006)
- [X] T031 [US3] Crear `src/pages/media/[...path].ts` (`prerender = false`, `GET` y `HEAD`): valida la ruta con una expresión estricta, lee `env.MEDIA.get(key)` y responde con los encabezados de contracts/http-routes.md; 404 para `originals/` y rutas ajenas (depende de T009)
- [X] T032 [P] [US3] Crear `src/components/WorkCard.astro`: miniatura con `alt` descriptivo (título o categoría), título, categoría, según el mockup 4 (sin botones "Editar" y "Retirar")
- [X] T033 [US3] Reescribir `src/pages/admin/index.astro` (el `<h1>` visible pasa a "Mis trabajos"; el `<title>` del documento se mantiene como "Panel de trabajos | Samuelé Repostería", igual que el login): `PanelHeader`, botón "+ Nuevo trabajo" a `/admin/works/new`, lista con `WorkCard` desde `listWorks(LIST_LIMIT)` y `toPanelItems`, estado vacío, aviso `?publicado=1` y estado de error 503 de contracts/http-routes.md (depende de T022, T030, T032)
- [X] T034 [P] [US3] Añadir a `src/styles/global.css` los estilos de la lista (`.work-card-admin`, miniatura, categoría, botón "+ Nuevo trabajo", estado vacío y aviso de éxito) según el mockup 4

**Checkpoint**: la lista confirma lo publicado

---

## Phase 6: User Story 4 - Cancelar o recuperarse de un error al publicar (Priority: P3)

**Goal**: se puede volver sin guardar, y un fallo permite reintentar sin perder lo escrito ni crear duplicados.

**Independent Test**: llenar el formulario y pulsar "Cancelar": no se crea trabajo. Simular un fallo de red al publicar: mensaje sencillo, campos conservados y reintento posible (quickstart §5 paso 6).

- [X] T035 [US4] Añadir el enlace "Cancelar" a `/admin` en `src/components/WorkForm.astro`, sin ejecutar ninguna escritura
- [X] T036 [US4] Completar `src/scripts/work-form.ts`: mientras se publica, deshabilitar el botón con el texto "Publicando…" y `aria-busy="true"`; ante `422` mostrar el mensaje junto al campo indicado en `error.field`; ante `503`, error de red o fallo de `optimizePhoto` mostrar el mensaje sencillo de `src/lib/works/messages.ts`, **conservar** título, descripción, categoría y foto elegida, y reactivar el botón conservando el mismo `id` para que el reintento sea idempotente; si la respuesta es `401`, redirigir a `/admin/login` (sin mensaje adicional; la pantalla de login no lo define) (depende de T025)

**Checkpoint**: el flujo es tolerante a errores en celular con señal irregular

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: documentación, decisiones, verificación y requisitos de producción

- [X] T037 [P] Actualizar `docs/adr/0005-optimizacion-de-imagenes.md`: aclarar que HEIC se rechaza con mensaje claro si llega sin convertir, y registrar la verificación de metadatos en el servidor (research D1 y D4) con su fecha
- [X] T038 [P] Actualizar `README.md`: nuevas rutas, tablas `categories` y `works`, binding `MEDIA`, cómo probar el flujo en local y el requisito previo de crear el bucket `samuele-media` y activar R2 con alerta de facturación (research D11)
- [X] T039 Ejecutar `npm run lint`, `npm run check`, `npm run format:check` y `npm test`; corregir lo que falle
- [X] T040 Recorrer [quickstart.md](quickstart.md) secciones 2 a 4 en local (migración, recorrido en navegador, verificación de la foto con `exiftool` e `identify`) y anotar resultados. **Resultado (2026-10-19)**: migración local aplicada con las 4 categorías; con `curl` y sesión real en `npm run dev`: sin sesión 303/401, derivada con EXIF → 422, publicación → 201, reintento con el mismo `id` → 201 sin duplicar, `/media/.../sm.jpg` → 200 `image/jpeg`, `originals/` → 404, aviso `?publicado=1` visible. **No cubierto** (necesita navegador/celular, queda para T041): `optimizePhoto` con canvas, orientación y comprobación con `exiftool`/`identify`
- [X] T041 Probar en un celular real **antes de abrir el PR** (constitución, principio II) con `npm run dev -- --host` desde la misma red, en Android y, si es posible, iPhone: galería **y cámara** en el selector de foto (FR-006; si la cámara no aparece, aplicar el plan B de un segundo botón "Tomar foto" con `capture`), foto vertical, foto con ubicación, crear un trabajo en **menos de 1 minuto** (SC-001), sin conexión y reintento, y anotar el formato real de la foto del celular de la administradora (quickstart §5; pregunta abierta del PRD) **Resultado (2026-10-19)**: Samsung Galaxy A11 (Android) con `npm run dev -- --host`; el selector ofrece cámara y galería (no hizo falta el plan B del botón «Tomar foto»); publicar con la cámara tardó 29 s (SC-001 cumplido); foto vertical con etiquetas de ubicación activadas: miniatura derecha y las tres derivadas WebP (400×533, 900×1200, 1600×2133) sin EXIF ni XMP (comprobado con `sharp`; solo conservan el perfil de color); sin conexión: mensaje «No pudimos guardar el trabajo. Intenta de nuevo.» y el formulario conserva lo elegido. **No verificado**: el reintento al reconectar, porque el servidor de desarrollo (Vite) recarga la página al recuperar la conexión; se da por bueno por decisión del usuario y por las pruebas automáticas de idempotencia (`create.test.ts`, `works-api.test.ts`). **No probado**: iPhone (sin dispositivo disponible). Formato real de la foto original del celular: no se registró (derivadas generadas en WebP)
- [X] T042 Antes de fusionar: crear el bucket `samuele-media` en Cloudflare, activar R2 con la alerta de facturación (acción de la dueña de la cuenta; ADR 0004) y confirmar que existe, porque `deploy.yml` corre al fusionar a `main`. Después abrir el PR, esperar CI en verde, fusionar y repetir en producción la prueba de T041 **Resultado (2026-10-22)**: bucket `samuele-media` creado con R2 activo (tarjeta de un familiar de la dueña) y alerta de uso por correo («R2 Storage usage above 10», Billing › Usage based billing); PR #15 fusionado y `deploy` en verde (1m11s). Prueba en producción con el Samsung Galaxy A11: publicar con la cámara tardó 41 s (SC-001 cumplido); vuelve a `/admin` con el aviso y la tarjeta con miniatura; la foto abre desde `/media/...`; sin conexión: mensaje «No pudimos guardar el trabajo. Intenta de nuevo.» con los campos conservados; al reconectar, el reintento publicó una sola vez, sin duplicar (idempotencia verificada en producción). Los dos trabajos de prueba se borraron de D1 y R2. **No probado**: iPhone
- [X] T043 Medir Lighthouse móvil sobre `/admin` y `/admin/works/new` con sesión (≥90, SC-007) y verificar teclado y lector de pantalla (quickstart §6) **Resultado (2026-10-23)**: medido a mano en Chrome (DevTools › Lighthouse, móvil, ventana de incógnito) sobre el build de `npm run preview` en local con sesión: `/admin` y `/admin/works/new` obtienen rendimiento 100 y accesibilidad 100, estable en varias corridas (SC-007 cumplido). Teclado: recorrido completo de `/admin` y `/admin/works/new` sin ratón, sin problemas. Lector de pantalla (Narrador de Windows): etiquetas y errores anunciados correctamente. **No medido**: Lighthouse contra producción
- [X] T044 Medir el CPU de `POST /api/admin/works` en producción (riesgo R1, quickstart §7); si pasa de 10 ms, aplicar la mitigación de research D2 (una petición `PUT` por archivo) o registrar el riesgo aceptado, como se hizo en 002 **Resultado (2026-10-23)**: en producción (Cloudflare › Workers › Observabilidad), `POST /api/admin/works` registra `cpuTimeMs` = 9, dentro del límite de 10 ms (riesgo R1). Margen estrecho: no se aplica la mitigación de research D2, pero conviene volver a medir si se agregan pasos al flujo de publicación o si el plan gratuito empieza a dar errores 1102 (CPU excedido). Los otros registros de Observabilidad son `GET` de unos 3 ms. Los dos trabajos de prueba se borraron de D1 y R2 y se comprobó en `/admin` de producción
- [ ] T045 Probar con la administradora real que publica su primer trabajo sin ayuda (SC-006) y registrar el resultado en este archivo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias
- **US2 (Phase 3)**: depende de Foundational
- **US1 (Phase 4)**: depende de Foundational **y de US2** (usa `media.ts` y `optimize.ts`)
- **US3 (Phase 5)**: depende de Foundational; para probarla con datos reales necesita US1, pero sus pruebas automatizadas son independientes
- **US4 (Phase 6)**: depende de US1 (`work-form.ts`, `WorkForm.astro`)
- **Polish (Phase 7)**: depende de las historias deseadas. Orden obligado al final: T041 (celular real) → T042 (bucket creado, PR, fusión y despliegue) → T043 a T045

### Within Each User Story

- Pruebas primero, deben fallar antes de implementar
- Lógica pura → almacenes → rutas y páginas → script de cliente → estilos

### Parallel Opportunities

- T002; T005, T006, T007, T008 (tras T003 para T009)
- US2: T010 y T011 juntas; T013 en paralelo con T012
- US1: T015 a T018 juntas; T022, T023 y T026 en paralelo
- US3: T027 a T029 juntas; T032 y T034 en paralelo
- US3 puede avanzar en paralelo con US1 una vez terminada Foundational (archivos distintos salvo `global.css`: coordinar T026 y T034)
- T037 y T038 en paralelo

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 juntas:
Task: "Escribir tests/works/validate.test.ts"
Task: "Escribir tests/works/create.test.ts"
Task: "Escribir tests/works/works-api.test.ts"
Task: "Escribir tests/works/new-page.test.ts"

# Componentes y estilos en paralelo:
Task: "Crear src/components/PanelHeader.astro"
Task: "Crear src/components/WorkForm.astro"
Task: "Añadir estilos del formulario en src/styles/global.css"
```

---

## Implementation Strategy

### MVP First (US2 + US1)

1. Phase 1: Setup y Phase 2: Foundational
2. Phase 3: US2 (validación y optimización de la foto)
3. Phase 4: US1 (formulario y creación)
4. **DETENERSE y VALIDAR**: publicar un trabajo en local y comprobar las derivadas (quickstart §3 y §4)
5. Continuar con US3 para ver la lista

### Incremental Delivery

1. Setup + Foundational → base lista
2. US2 + US1 → se puede publicar (MVP; la lista aún muestra el marcador de 002)
3. US3 → lista con miniaturas y estado vacío
4. US4 → tolerancia a errores
5. Polish → ADR, README, prueba en celular real, CPU y prueba con la administradora

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- La etiqueta [Story] vincula la tarea con la historia para trazabilidad
- T041 a T045 dependen de acciones fuera del código (cuenta de Cloudflare, celular real, la administradora)
- Confirmar cada tarea con una prueba o comprobación manual antes de marcarla; commit por tarea o grupo lógico en la rama `feature/003-panel-nuevo-trabajo`
