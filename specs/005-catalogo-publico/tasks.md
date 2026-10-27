---

description: "Lista de tareas para la funcionalidad 005: catálogo público y detalle de trabajo con WhatsApp"
---

# Tasks: Catálogo público y detalle de trabajo con WhatsApp

**Input**: Documentos de diseño en `/specs/005-catalogo-publico/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-routes.md, quickstart.md

**Tests**: INCLUIDAS. La constitución (principio V) las exige para la lógica de negocio y los flujos críticos, y el plan enumera la estrategia de pruebas. Dentro de cada historia se escriben primero y deben fallar antes de implementar. Lo que no corre en Node (WhatsApp real, vista previa, "Volver" con posición, columnas, Lighthouse, CPU) se verifica en celular real y producción (Phase 9).

**Organization**: Tareas agrupadas por historia de usuario. US1 (catálogo), US2 (detalle y WhatsApp), US3 (pie) y US4 (refleja los cambios del panel) son P1; US5 (vista previa) y US6 (errores y carga) son P2. US2 depende de US1 (las tarjetas enlazan al detalle) y US3 se integra en la página de US1. US4 no agrega pantallas: fija con pruebas y cabeceras que lo publicado se ve al instante.

**Nota sobre las páginas**: `src/pages/*.astro` leen `cloudflare:workers` y no se pueden renderizar en Node. Por eso cada página es delgada: la lógica de carga vive en `src/lib/catalog/load.ts` (recibe `WorksStore`) y la presentación en componentes `CatalogView.astro` y `DetailView.astro` que se prueban con `AstroContainer` y props, como `WorksPanel` en 004. Las pruebas del plan llamadas `catalog-page` y `detail-page` son `catalog-view` y `detail-view`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1 a US6)
- Todas las rutas son relativas a la raíz del repositorio

## Path Conventions

Proyecto único de Astro (ver plan.md, "Decisión de estructura"): lógica en `src/lib/catalog/` y `src/lib/site/` sin importar `cloudflare:workers`; solo las páginas leen `env`. Pruebas en `tests/catalog/`, con `createMemoryWorksStore` como en 003 y 004. No hay migración ni cambios en el panel ni en `/media`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: ninguna dependencia ni binding nuevos (plan.md, Technical Context); solo se confirma la base de partida.

- [X] T001 Confirmar que la rama `feature/005-catalogo-publico` parte de `main` al día (con los mockups y la spec 005 comprometidos) y que `npm run lint`, `npm run check`, `npm run format:check` y `npm test` pasan antes de tocar nada (línea base de 004)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: configuración de contacto, enlaces de WhatsApp, categorías públicas, consulta filtrada, mensajes, layout y la imagen de vista previa, que usan todas las historias.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [X] T002 [P] Crear `src/lib/site/contact.ts` exportando `SITE` (research D6, data-model "Configuración de contacto"): `name: "Samuelé Repostería"`, `tagline: "Creamos momentos dulces"`, `whatsapp: "+57 316 544 1337"`, `footerNote: "Cotiza por WhatsApp"`, `messages.general: "Hola Samuelé, vi su catálogo y quiero más información."` y `messages.work: 'Hola Samuelé, me interesa el trabajo "{title}". ¿Me puedes dar más información?'` (con el marcador `{title}`); comentario en español de que es el único lugar a editar para cambiar el número (SC-004) y de que no es secreto. Sin teléfono, zona ni anticipación (FR-019)
- [X] T003 [P] Escribir `tests/catalog/whatsapp.test.ts` (debe fallar antes de T004): `normalizePhone("+57 316 544 1337")` → `"573165441337"` y acepta espacios, `+`, guiones y paréntesis; rechaza (devuelve `null`) menos de 8 o más de 15 dígitos y texto sin dígitos; `formatPhone` devuelve `+57 316 544 1337`; `workMessage("Torta de Chocolate")` → `Hola Samuelé, me interesa el trabajo "Torta de Chocolate". ¿Me puedes dar más información?`; `whatsappUrl(number, text)` → `https://wa.me/573165441337?text=` con el texto pasado por `encodeURIComponent` (probar acentos, comillas, `&`, `#` y emojis sin romper la URL); una prueba que falla si `SITE.whatsapp` no es válido (FR-021); `SITE` no contiene "teléfono", "zona" ni "anticipación"
- [X] T004 Crear `src/lib/catalog/whatsapp.ts` con `normalizePhone(raw): string | null` (solo dígitos, **8–15 dígitos**, si no `null`), `formatPhone(raw): string` (formato legible `+57 316 544 1337`; si no sabe formatear devuelve `+` y los dígitos), `workMessage(title): string` (sustituye `{title}` de `SITE.messages.work`) y `whatsappUrl(number, text): string` (`https://wa.me/{dígitos}?text={encodeURIComponent(text)}`; lanza un error claro si el número no es válido); también `generalWhatsappUrl()` y `workWhatsappUrl(title)` que usan `SITE`. Hace pasar T003
- [X] T005 [P] Escribir `tests/catalog/categories.test.ts` (debe fallar antes de T006): `categorySlug("Tortas")` → `"tortas"` y quita tildes y pasa a minúsculas; `toCatalogCategories(categories, activeSlug)` devuelve "Todos" primero (`href: "/"`) y luego una por categoría en orden (`href: "/?categoria={slug}"`), con `active` correcto; `resolveCategory(categories, "tortas")` devuelve la categoría; con un valor desconocido, vacío, `undefined` o repetido devuelve `null` (= Todos, sin error); las cuatro categorías siguen visibles aunque no tengan trabajos (FR-005)
- [X] T006 Crear `src/lib/catalog/categories.ts` con `categorySlug`, `resolveCategory` y `toCatalogCategories` según T005 (tipo `CatalogCategory { slug, name, href, active }`). Hace pasar T005
- [X] T007 [P] Escribir `tests/catalog/store-public.test.ts` contra la versión en memoria (debe fallar antes de T008): `listWorks(limit, categoryId)` devuelve solo los de esa categoría; sin `categoryId` devuelve todos los activos; excluye retirados; más reciente primero; respeta `limit`; el panel (`listWorks(limit)` sin categoría) sigue igual
- [X] T008 Cambiar `listWorks(limit, categoryId?)` en `src/lib/works/store.ts` (interfaz, `createD1WorksStore` y `createMemoryWorksStore`): con `categoryId` agrega `AND works.category_id = ?` (usa `works_category_id_idx`), siempre `retired_at IS NULL` y `ORDER BY created_at DESC`; sin cambiar el comportamiento del panel. Hace pasar T007
- [X] T009 [P] Crear `src/lib/catalog/messages.ts` con las claves de data-model.md, "Mensajes": `empty` ("Estamos preparando nuestro catálogo. Muy pronto verás aquí nuestros trabajos."), `emptyCategory` ("Todavía no hay trabajos en esta categoría."), `loadFailed` ("No pudimos cargar los trabajos. Intenta de nuevo en un momento."), `detailUnavailable` ("Este trabajo ya no está disponible."), `detailFailed` ("No pudimos cargar este trabajo. Intenta de nuevo en un momento."), `loadMore` ("Ver más trabajos") y las etiquetas de enlace ("Ver todos", "Reintentar", "Ver el catálogo", "← Volver", "Preguntar por WhatsApp")
- [X] T010 [P] Crear `public/og-logo.jpg` (600×600, < 100 KB, JPG) a partir de `src/assets/logo-samuele.jpg` con `sharp` en un comando de una sola vez (`node --input-type=module`, sin dejar el script en el repo) y comprobar su peso y tamaño con `file` y `ls -l` (research D8, R3)
- [X] T011 Ampliar `src/layouts/BaseLayout.astro` (research D8 y D10): props opcionales `description`, `image` (ruta o URL), `ogType` (por defecto `website`) y `variant: "default" | "catalog"`; con `description` emite `<meta name="description">`; con `title`+`description` emite `og:title`, `og:description`, `og:type`, `og:url` (`Astro.url.href`), `og:locale="es_CO"` y, si hay `image`, `og:image` **absoluta** con `Astro.url.origin`; `variant="catalog"` pone la clase `catalog` en `<main>`. Sin las props nuevas el HTML de login, panel, 404 y 003/004 **no cambia**; confirmar con las pruebas existentes (`npm test`)

**Checkpoint**: base lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Ver el catálogo y filtrar por categoría (Priority: P1) 🎯 MVP

**Goal**: `/` muestra cabecera, categorías como enlaces y la grilla de trabajos activos (más reciente primero), con filtro por categoría, "Ver más", estado vacío y categoría sin trabajos.

**Independent Test**: con trabajos en al menos dos categorías, abrir `/` sin sesión, comprobar que aparecen todos, tocar una categoría y ver solo los suyos, y que "Todos" los devuelve. Se cubre con `view.test.ts`, `load.test.ts` y `catalog-view.test.ts`; columnas y desplazamiento en celular real.

### Tests for User Story 1 (escribir primero; deben fallar)

- [X] T012 [P] [US1] Escribir `tests/catalog/view.test.ts`: `toCatalogCards(rows)` conserva el orden recibido y por tarjeta da `href: "/trabajos/{id}"`, `title` (o el nombre de la categoría si es nulo), `category`, `photoUrl` = `mediaUrl(id, photoVersion, "sm", photoExt)` y `alt` = `{título} — {categoría}`; al cambiar `photoVersion` cambia `photoUrl` (FR-025); `parsePage("3")` → 3, inválido, `0`, negativo, decimal o ausente → 1, y se limita a **8** (`MAX_PAGE`); `pageLimit(page)` = `24 × page + 1` (pide uno más, FR-011); `slicePage(rows, page)` devuelve `{ items, hasMore }` con los primeros `24 × page` y `hasMore` cuando llegó el extra; con 100 trabajos y `page = 1` hay 24 tarjetas (SC-010); el resultado no contiene `retiredAt` ni otros campos internos (FR-032)
- [X] T013 [P] [US1] Escribir `tests/catalog/load.test.ts` para `loadCatalog(store, { categoria, pagina })`: devuelve `{ state: "items", items, hasMore, categories, active }`; con la base vacía `state: "empty"` (y las categorías igual); con una categoría sin trabajos `state: "emptyCategory"`; categoría desconocida = Todos; excluye retirados; más reciente primero; con `store.failList = true` devuelve `state: "error"` y registra el error con `console.error` sin lanzarlo (la prueba de errores completa es de US6, aquí solo el contrato)
- [X] T014 [P] [US1] Escribir `tests/catalog/catalog-view.test.ts` renderizando `CatalogView.astro` con `AstroContainer` y props: cabecera con el logo (alt no vacío), "Samuelé Repostería" y "Creamos momentos dulces"; `<nav aria-label="Categorías">` con "Todos", "Tortas", "Postres", "Rollos" y "Otros" como enlaces (`href="/?categoria=tortas"`), el activo con `aria-current="page"`; cada trabajo es **un solo** `<a href="/trabajos/{id}">` con `<img>` (`alt` no vacío), título y categoría; sin títulos sale la categoría; `state: "empty"` muestra el mensaje `empty` conservando cabecera y categorías; `state: "emptyCategory"` muestra `emptyCategory` y un enlace "Ver todos" a `/`; con `hasMore` aparece "Ver más trabajos" con `href` a `?pagina=2` (y con `&categoria=` cuando hay filtro) y sin `hasMore` no aparece; no hay precios ni símbolos de moneda (FR-023)

### Implementation for User Story 1

- [X] T015 [US1] Crear `src/lib/catalog/view.ts` con `CATALOG_PAGE_SIZE = 24`, `MAX_PAGE = 8` (= `LIST_LIMIT / 24` redondeado hacia abajo; documentar el vínculo con `LIST_LIMIT` de `src/lib/works/limits.ts`), `parsePage`, `pageLimit`, `slicePage` y `toCatalogCards` (tipo `CatalogCard { id, href, title, category, photoUrl, alt }`) según T012. Hace pasar T012
- [X] T016 [US1] Crear `src/lib/catalog/load.ts` con `loadCatalog(store: WorksStore, query: { categoria?: string; pagina?: string })`: lee `listCategories()`, resuelve la categoría (T006), llama `listWorks(pageLimit(page), categoryId)`, arma tarjetas y devuelve el estado `items | empty | emptyCategory | error` del contrato (el vacío general es "sin filtro y sin trabajos"). Atrapa los fallos de D1 y devuelve `error` (research, FR-010). Hace pasar T013
- [X] T017 [P] [US1] Crear `src/components/CatalogHeader.astro`: cabecera compacta del mockup 1 (logo circular de `src/assets/logo-samuele.jpg` con `<Image>` como `BrandHeader`, ~64 px en móvil y ~96 px en escritorio, nombre con la tipografía script y lema), con `<h1>` solo en el catálogo; el resto de páginas siguen usando `BrandHeader`
- [X] T018 [P] [US1] Crear `src/components/CategoryChips.astro` (props: `categories: CatalogCategory[]`): `<nav aria-label="Categorías">` con `<ul>` de enlaces; el activo con `aria-current="page"` y fondo `--rosa-oscuro` con texto blanco; los demás con borde dorado; alto ≥ 44 px, texto 16 px; fila con `overflow-x: auto` solo en la fila (FR-003); la categoría activa se acerca a la vista con `scroll-margin`/orden inicial sin JavaScript
- [X] T019 [P] [US1] Crear `src/components/CatalogCard.astro` (props: `card: CatalogCard`, `priority?: boolean`): toda la tarjeta es un `<a href>`; imagen cuadrada (`aspect-ratio: 1`, `object-fit: cover`, `width=400 height=400`), título (16 px) y categoría (14 px, negrita, `--rosa-oscuro`); foco visible; sin lógica de carga todavía (la prioridad y `lazy` van en US6)
- [X] T020 [P] [US1] Crear `src/components/CatalogMessage.astro` (props: `kind`, `message`, `action?: { href, label }`): bloque de aviso con el estilo de `.notice`, `role="status"` para vacío y `role="alert"` para error; lo usan los estados vacío, categoría sin trabajos y error
- [X] T021 [US1] Crear `src/components/CatalogView.astro` (props: `categories`, `cards`, `state`, `hasMore`, `nextHref`, `retryHref`): compone `CatalogHeader`, `CategoryChips`, `<ul class="work-grid">` de `CatalogCard`, el enlace "Ver más trabajos" y los mensajes (`CatalogMessage`) según el estado; deja un hueco para el pie (US3). Hace pasar T014
- [X] T022 [US1] Reemplazar `src/pages/index.astro`: `prerender = false`, `loadCatalog(createD1WorksStore(env.DB), { categoria, pagina })` con los parámetros de `Astro.url.searchParams`, `BaseLayout title="Samuelé Repostería" variant="catalog"` y `CatalogView`; mantener `export const prerender = false` y quitar el texto "Nuestro catálogo estará disponible muy pronto". El estado `error` y las cabeceras se completan en US4 y US6
- [X] T023 [US1] Añadir en `src/styles/global.css` los estilos del catálogo siguiendo el mockup y la regla de contraste de `mockups.md`: `main.catalog` (ancho máx. ≈ 60 rem, `text-align: left`, sin tocar el `main` global), `.catalog-header`, `.chips` (`display: flex; gap; overflow-x: auto`, sin barra intrusiva, 44 px mínimo), `.work-grid` (`grid-template-columns: repeat(2, 1fr)` en móvil y `repeat(3, 1fr)` desde 48 rem, `gap: .75rem`), `.work-card` (fondo blanco, radio 12 px, sombra suave, `:active` con escala leve), `.work-card:focus-visible`, `.catalog-more` (botón/enlace ≥ 44 px); `--rosa-oscuro` en lugar de `--rosa` para cualquier texto; sin desplazamiento horizontal de la página desde 320 px (`min-width: 0` en elementos de grilla, `overflow-wrap: anywhere` en títulos largos, edge case)
- [X] T024 [US1] Reescribir `tests/home.test.ts` para el catálogo: ya no espera "pronto"; renderiza `CatalogView` con estado vacío y comprueba nombre, lema, `<html lang="es">`, viewport móvil y que el logo tiene `alt` no vacío (los tres casos originales sobre el nuevo contenido) y que el texto "Nuestro catálogo estará disponible muy pronto" ya no aparece

**Checkpoint**: el catálogo funciona por sí solo y ya se puede demostrar (sin pie ni detalle)

---

## Phase 4: User Story 2 - Ver el detalle de un trabajo y preguntar por WhatsApp (Priority: P1)

**Goal**: cada tarjeta lleva a `/trabajos/{id}` con foto grande, categoría, título, descripción y el botón "Preguntar por WhatsApp" con la frase ya escrita; "← Volver" conserva filtro y posición; retirado o inexistente muestra 404 amable.

**Independent Test**: desde el catálogo tocar un trabajo, comprobar su contenido, pulsar "Preguntar por WhatsApp" (abre la conversación con el número y la frase del trabajo) y "← Volver" (mismo filtro y posición). Se cubre con `detail.test.ts`, `detail-load.test.ts` y `detail-view.test.ts`; el enlace real y "Volver" en celular.

### Tests for User Story 2 (escribir primero; deben fallar)

- [X] T025 [P] [US2] Escribir `tests/catalog/detail.test.ts` para `toDetailView(work)`: `title` (o categoría si es nulo), `category`, `description` ausente cuando es nula o vacía, `photoMd` y `photoLg` con `mediaUrl(…, "md"/"lg", ext)`, `alt` = `{título} — {categoría}` y `whatsappUrl` con la frase del trabajo (con título: `Hola Samuelé, me interesa el trabajo "Torta de Chocolate"…`, sin título: usa la categoría); un título con comillas, `&` y emojis queda codificado; al cambiar `SITE.whatsapp` (con `vi.spyOn`/mock del módulo) cambia el enlace sin tocar nada más (FR-020); no expone `retiredAt` ni `photoVersion` crudo
- [X] T026 [P] [US2] Escribir `tests/catalog/detail-load.test.ts` para `loadDetail(store, id)`: trabajo activo → `{ state: "found", view }`; id que no es UUID, inexistente o retirado → `{ state: "notFound" }` (sin consultar el almacén cuando no es UUID); `store.getWork` que lanza → `{ state: "error" }` con `console.error`
- [X] T027 [P] [US2] Escribir `tests/catalog/detail-view.test.ts` renderizando `DetailView.astro`: con trabajo, foto grande con `srcset` (`md 900w, lg 1600w`) y `alt`, etiqueta de categoría, `<h1>` con el título, la descripción solo si existe (sin descripción no hay párrafo ni hueco), la descripción con saltos de línea (`white-space: pre-line`) y con `<b>x</b>` visible **literal** (escapado, FR-013), el botón "Preguntar por WhatsApp" con `href` que empieza por `https://wa.me/573165441337?text=` (y **sin** la leyenda "Cotiza por WhatsApp", que vive solo en el pie), el enlace "← Volver" con `href="/"` y sin precios; `state: "notFound"` muestra "Este trabajo ya no está disponible." y el botón "Ver el catálogo" **sin** título, foto ni descripción; `state: "error"` muestra `detailFailed` con "Reintentar" y "Ver el catálogo" (distinto del anterior, FR-016)

### Implementation for User Story 2

- [X] T028 [US2] Crear `src/lib/catalog/detail.ts` con `toDetailView(work: ListedWork)` (tipo `DetailView`) según T025, y `loadDetail(store, id)` (usa `UUID` de `src/lib/works/validate.ts`, `store.getWork` y `console.error` en fallo) según T026. Hace pasar T025 y T026
- [X] T029 [P] [US2] Crear `src/scripts/back-link.ts` (research D5): para el enlace `[data-back]`, si `document.referrer` es del mismo origen y su ruta es `/`, el clic llama `history.back()` y cancela la navegación; en cualquier otro caso (enlace directo, sin referrer, otro sitio) no hace nada y el enlace va a `/` (FR-014); sin dependencias y de unas pocas líneas
- [X] T030 [US2] Crear `src/components/DetailView.astro` (props: `state`, `view?`, `retryHref?`) y `src/components/WorkDetail.astro` según el mockup 2: foto cuadrada grande (`aspect-ratio: 1`) con `srcset` y `sizes="(min-width: 48rem) 36rem, 100vw"`, "← Volver" (`data-back`, con el `<script>` de T029 empaquetado por Astro), etiqueta con fondo `--rosa-oscuro`, `<h1>` con el título, descripción en un `<p>` con `white-space: pre-line`, botón "Preguntar por WhatsApp" (`<a class="btn-primary btn-block">`, ≥ 48 px, `target="_blank" rel="noopener noreferrer"`) y la leyenda; los estados `notFound` y `error` reutilizan `CatalogMessage` con los botones indicados. Hace pasar T027
- [X] T031 [US2] Crear `src/pages/trabajos/[id].astro`: `prerender = false`, `loadDetail(createD1WorksStore(env.DB), Astro.params.id)`, `Astro.response.status` = 404 (`notFound`) o 503 (`error`), `BaseLayout` con el título del trabajo (`{título} | Samuelé Repostería`) o "Trabajo no disponible | Samuelé Repostería" y `DetailView`; no emite etiquetas de vista previa todavía (US5). Probar con un id válido, uno inventado y uno que no sea UUID
- [X] T032 [US2] Añadir en `src/styles/global.css` los estilos del detalle según el mockup (`.detail-photo`, `.detail-tag`, `.detail-title` con tipografía script ≥ 1.75 rem, `.detail-description` 16 px con `line-height: 1.6`, `.back-link` ≥ 44 px, ancho máximo 40 rem centrado en escritorio, sin desplazamiento horizontal desde 320 px y descripciones largas sin desbordar)

**Checkpoint**: el catálogo y el detalle funcionan de punta a punta con WhatsApp

---

## Phase 5: User Story 3 - Contacto en el pie del catálogo (Priority: P1)

**Goal**: el catálogo termina con un pie con CONTACTO (WhatsApp con su número, tocable) y la leyenda "Cotiza por WhatsApp"; sin botón flotante, teléfono, zona ni anticipación.

**Independent Test**: tocar el WhatsApp del pie (abre la conversación con el mensaje general); comprobar que no hay botón flotante; cambiar el número en `contact.ts` y ver el cambio en pie y detalle. Se cubre con `footer.test.ts`; la conversación real en celular.

- [X] T033 [P] [US3] Escribir `tests/catalog/footer.test.ts` renderizando `SiteFooter.astro` y `CatalogView.astro`: el pie tiene el título "CONTACTO", el texto `+57 316 544 1337` en un `<a href="https://wa.me/573165441337?text=…">` con el mensaje general codificado, y la leyenda "Cotiza por WhatsApp"; **no** contiene "Teléfono", "ZONA DE ATENCIÓN", "ANTICIPACIÓN", "llamada", `tel:` ni `$`; el catálogo completo no contiene `class="fab"` ni "flotante" (FR-017); en el estado vacío y en el de error el pie sigue presente (FR-009, FR-010)
- [X] T034 [US3] Crear `src/components/SiteFooter.astro` (sin props; lee `SITE` y `generalWhatsappUrl()`/`formatPhone`): `<footer>` con CONTACTO (enlace de WhatsApp de ≥ 44 px, `target="_blank" rel="noopener noreferrer"`) y la leyenda `SITE.footerNote`, estilos `.site-footer` en `src/styles/global.css` (fondo blanco, borde superior, texto 16 px, centrado). Hace pasar T033
- [X] T035 [US3] Integrar `SiteFooter` en `src/components/CatalogView.astro` (ocupando el hueco de T021) para todos los estados y confirmar que el detalle **no** lo muestra (research, "Pie del detalle")

**Checkpoint**: el catálogo cumple el mockup 1 ajustado (sin flotante, pie reducido)

---

## Phase 6: User Story 4 - El catálogo refleja lo que cambia la administradora (Priority: P1)

**Goal**: publicar, editar (título, categoría, descripción, foto) y retirar desde el panel se ve en el catálogo y el detalle en la siguiente visita, sin despliegue ni limpiar el navegador.

**Independent Test**: publicar, editar y retirar un trabajo con los casos de uso reales y comprobar el catálogo y el detalle tras cada paso; en el navegador, con el panel y el catálogo abiertos (quickstart §4).

- [X] T036 [P] [US4] Escribir `tests/catalog/freshness.test.ts` usando `createMemoryWorksStore` y `createMemoryMediaStore` con los casos de uso **reales** de 003/004 (`createWork`, `updateWork`, `retireWork`): publicar → `loadCatalog` lista el trabajo primero; editar título, categoría y descripción → la tarjeta y `loadDetail` muestran los datos nuevos y el trabajo aparece bajo su categoría nueva y desaparece de la anterior; reemplazar la foto → `photoUrl` (`sm`) y `photoMd`/`photoLg` usan la versión nueva y ninguna vista contiene la URL anterior (FR-025); retirar → `loadCatalog` ya no lo trae y `loadDetail` devuelve `notFound` (FR-026); editar **no** cambia su lugar en la lista
- [X] T037 [US4] Fijar la frescura en las páginas públicas (research D1): `src/pages/index.astro` y `src/pages/trabajos/[id].astro` responden con `Cache-Control: no-cache` (también en 404 y 503); extraer la cabecera a una constante en `src/lib/catalog/view.ts` (`CATALOG_CACHE_CONTROL`) y probar su valor en `tests/catalog/view.test.ts`. Confirmar que `/media` conserva `public, max-age=31536000, immutable` (sin tocarla) y que `/admin` sigue en `no-store`
- [X] T038 [US4] Revisar a mano en `npm run dev` el flujo de quickstart §4 (publicar, editar con foto nueva, retirar, tocar un trabajo retirado desde una pestaña vieja) y anotar el resultado en una línea del PR; corregir lo que falle antes de seguir
  - _Resultado (2026-10-27)_: verificado con `astro dev` y D1 local mediante `curl` (filtro, categoría vacía o desconocida, retirado excluido, detalle 200/404, `Cache-Control: no-cache`, descripción escapada, enlaces `wa.me`, Open Graph). El flujo con foto real y el panel en el navegador queda para T051.

**Checkpoint**: las cuatro historias P1 completas

---

## Phase 7: User Story 5 - Compartir el enlace con una buena vista previa (Priority: P2)

**Goal**: el enlace principal y el de cada detalle muestran al compartirse título, descripción e imagen; un trabajo retirado no expone nada.

**Independent Test**: pegar los enlaces en un chat de WhatsApp y comprobar título, descripción e imagen (quickstart §5); las etiquetas se prueban con `og.test.ts`.

- [X] T039 [P] [US5] Escribir `tests/catalog/og.test.ts` con `AstroContainer` sobre `BaseLayout` (o la vista que lo use): la portada incluye `<meta name="description" content="Creamos momentos dulces. Mira nuestros trabajos y pregunta por WhatsApp.">`, `og:title` "Samuelé Repostería", `og:type` `website`, `og:locale` `es_CO` y `og:image` **absoluta** que termina en `/og-logo.jpg`; el detalle de un trabajo incluye `og:title` con su título, `og:description` (inicio de la descripción ≤ 150 caracteres sin saltos, o `{categoría} de Samuelé Repostería` si no tiene) y `og:image` absoluta con la URL `md` de su foto; la vista de `notFound` **no** contiene `og:image` ni el título del trabajo (FR-028); el título o la descripción con comillas o `<` se escapan en los atributos
- [X] T040 [US5] Pasar `description` e `image` desde `src/pages/index.astro` (portada, `/og-logo.jpg`) y desde `src/pages/trabajos/[id].astro` (título, descripción corta y `photoMd` del trabajo; nada cuando es 404/503); añadir en `src/lib/catalog/detail.ts` `shareDescription(view)` para recortar la descripción a 150 caracteres sin cortar palabras ni dejar saltos de línea. Hace pasar T039
- [X] T041 [US5] Probar en celular real la vista previa (quickstart §5) con una foto `webp` y una `jpg`; si WhatsApp o Instagram no muestran la `webp`, aplicar la mitigación de research R3 (usar el logo como `og:image` en ese caso) y dejar la decisión escrita en `research.md`
  - _Resultado (2026-10-27)_: en producción, el enlace principal y el de un trabajo con foto `webp` se ven bien al pegarlos en WhatsApp (título, descripción e imagen). Todas las derivadas publicadas son `webp` (el navegador convierte la original `jpg`), así que no hizo falta la mitigación de R3; las fotos de vista previa pesan entre 6 y 173 KB.

**Checkpoint**: el enlace se ve bien al compartirse

---

## Phase 8: User Story 6 - Errores y carga amables (Priority: P2)

**Goal**: ante un fallo, mensaje sencillo con reintento y sin pantalla rota; las fotos no mueven el diseño y una foto ausente muestra el logo.

**Independent Test**: simular el fallo de D1 y ver el mensaje con "Reintentar"; abrir con conexión lenta y ver que el contenido no se mueve (quickstart §6). Se cubre con `errors.test.ts` y `images.test.ts`.

- [X] T042 [P] [US6] Escribir `tests/catalog/errors.test.ts`: con `store.failList = true`, `loadCatalog` devuelve `state: "error"` y `CatalogView` muestra "No pudimos cargar los trabajos. Intenta de nuevo en un momento." con `role="alert"`, un enlace "Reintentar" a la misma dirección (conserva `?categoria=`), cabecera y pie, sin texto técnico (sin "D1", "Error", "stack" ni la causa); con un `getWork` que lanza, `DetailView` muestra `detailFailed` con "Reintentar" y "Ver el catálogo"; el 404 de detalle y el error son mensajes distintos
- [X] T043 [P] [US6] Escribir `tests/catalog/images.test.ts`: las tarjetas llevan `width="400"` y `height="400"`, `decoding="async"`, `alt` no vacío; las **4 primeras** sin `loading="lazy"` y la primera con `fetchpriority="high"`, el resto con `loading="lazy"` (FR-030); la foto principal del detalle sin `lazy`, con `srcset` y `sizes`; cada `<img>` de trabajo tiene el manejador `onerror` que la oculta para mostrar el logo de fondo del contenedor (edge case)
- [X] T044 [US6] Completar el manejo de errores: `src/pages/index.astro` y `src/pages/trabajos/[id].astro` fijan `Astro.response.status = 503` cuando el estado es `error` y arman `retryHref` con `Astro.url.pathname + Astro.url.search`; `CatalogView` y `DetailView` muestran los mensajes con `CatalogMessage` según T042. Hace pasar T042
- [X] T045 [US6] Implementar la carga de imágenes: `CatalogCard.astro` recibe `priority` (las 4 primeras; la primera con `fetchpriority="high"`), `loading`, `decoding="async"`, dimensiones y `onerror="this.hidden=true"`; el contenedor de la foto lleva el logo de fondo en CSS (`.photo-box`, degradado crema como el mockup) para que una foto ausente no muestre el ícono roto; hacer lo mismo en `WorkDetail.astro`. Hace pasar T043

**Checkpoint**: todas las historias completas

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: documentación, calidad, verificación en celular real y cierre en producción (como en 003 y 004).

- [X] T046 [P] Redactar `docs/adr/0009-catalogo-publico.md` (formato de los ADR existentes): catálogo SSR sin caché propia y por qué (research D1), filtro y paginación por enlaces (D2, D3), contacto en configuración versionada y número de prueba (D6), recorte del mockup (sin botón flotante, pie reducido), límite de 100.000 solicitudes/día con las cuentas de research R2 y la salida (Workers Paid o dominio con caché de borde)
- [X] T047 [P] Actualizar `README.md` (estructura del proyecto y rutas públicas `/` y `/trabajos/{id}`, y la sección de contacto: "para cambiar el número de WhatsApp se edita `src/lib/site/contact.ts` y se despliega") y la nota de estado de `docs/adr/0002-stack-tecnologico.md` con el resultado de CPU cuando exista (T052)
- [X] T048 [P] Actualizar `docs/prd-fase-1.md` solo si cambió algo respecto a lo aprobado (HU-05 reducida a WhatsApp y HU-03 sin botón flotante) añadiendo una nota breve al pie de cada historia afectada, y `docs/design/mockups.md` marcando las pantallas 1, 2 y 6 como **Implementado** (spec 005) y quitando lo ya cubierto de "Pendiente" (estado vacío del catálogo)
- [X] T049 Agregar a `lighthouserc.json` la URL `http://localhost:4321/` ya existente sin cambios y confirmar que sigue auditando el estado vacío del catálogo (CI con base vacía; `lighthouserc.json` ya incluye `/`, sin cambios); documentar en `quickstart.md` §7 que la auditoría con datos es manual
- [X] T050 Ejecutar `npm run lint`, `npm run check`, `npm run format:check`, `npm test` y `npm run build`; corregir lo que falle y confirmar que no quedaron referencias a `fab`, "flotante" ni datos del mockup (`+57 300 123 4567`, "Medellín y alrededores", "3-5 días") en `src/`, `tests/` ni `public/` (`grep`)
- [X] T051 Prueba en **celular real** (principio II) siguiendo `quickstart.md` §2 a §6: catálogo con filtro y "Ver más", dos y tres columnas, sin desplazamiento horizontal desde 320 px, detalle, **WhatsApp con la frase ya escrita** y el mensaje general del pie, "← Volver" con filtro y posición, vista previa al compartir; registrar el resultado y los ajustes en este archivo
  - _Resultado (2026-10-27)_: probado en Samsung Galaxy A11 con Chrome y con Brave, y en una tableta, sobre `https://samuele-reposteria.samuele-re.workers.dev/`. Catálogo (2 columnas, fotos iguales, "Ver detalles", filtro, pie) y detalle (foto, WhatsApp con la frase ya escrita, "← Volver" con filtro y posición, enlace directo) cumplen; la tableta se ve bien. Un ajuste: la barra de desplazamiento de las categorías pisaba los botones; corregido con margen inferior.
- [ ] T052 Abrir el PR a `main` (Conventional Commits en inglés con `Refs: HU-01, HU-02, HU-03, HU-04, HU-05, HU-13, HU-15`), esperar CI en verde, fusionar con squash, comprobar el despliegue y medir en producción con 24 trabajos reales: Lighthouse móvil de `/` y de un `/trabajos/{id}` ≥ 90 (SC-008), CPU P50 y P99 de `/`, `/trabajos/{id}` y `/media/…` ≤ 10 ms (R1, SC-013) y solicitudes por visita inicial (R2); anotar los valores aquí y en la nota de ADR 0002
  - _Estado (2026-10-27)_: PR #19 fusionado (CI verde) y desplegado. **Pendiente, aplazado a propósito**: Lighthouse, CPU y solicitudes por visita se medirán en producción cuando la administradora cargue 24 trabajos o más y antes de compartir el catálogo, para medir con fotos y datos reales.
- [X] T053 Probar en producción el cambio de número: editar `SITE.whatsapp` con el número real de la administradora cuando lo entregue, desplegar y repetir quickstart §3.3 y §3.4 (SC-004); hasta entonces el número de prueba `+57 316 544 1337` queda activo
  - _Resultado (2026-10-28)_: PR #21 desplegado con el número de la administradora en `src/lib/site/contact.ts`. En producción, el botón "Preguntar por WhatsApp" del detalle y el WhatsApp del pie abren el chat correcto (verificado en el celular); el HTML trae `wa.me/` con su número en ambos. Las pruebas ya no fijan el número, así que un cambio futuro solo toca `contact.ts`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T011)** → historias → **Polish (T046–T053)**
- Foundational bloquea todas las historias.
- **US1 (T012–T024)** es el MVP y no depende de otras historias.
- **US2 (T025–T032)** depende de US1 solo para que las tarjetas lleven al detalle (la página `/trabajos/{id}` puede construirse antes con la base de Foundational).
- **US3 (T033–T035)** se integra en `CatalogView` de US1.
- **US4 (T036–T038)** depende de US1 y US2 (usa `loadCatalog` y `loadDetail`) y toca las dos páginas.
- **US5 (T039–T041)** depende de US1 y US2 (las páginas) y de `BaseLayout` (T011).
- **US6 (T042–T045)** depende de US1 y US2 y modifica los mismos componentes (`CatalogCard`, `CatalogView`, `DetailView`).

### Dentro de cada historia

- Las pruebas se escriben primero y deben fallar.
- Lógica (`src/lib/catalog/`) → componentes → páginas → estilos.
- `src/styles/global.css` lo tocan T023, T032, T034 y T045: hacerlos en ese orden, no en paralelo.
- `src/pages/index.astro` lo tocan T022, T037, T040 y T044; `src/pages/trabajos/[id].astro`, T031, T037, T040 y T044: en orden.

### Parallel Opportunities

- Foundational: T002, T003, T005, T007, T009 y T010 (archivos distintos).
- US1: pruebas T012, T013 y T014 juntas; componentes T017, T018, T019 y T020 juntos.
- US2: pruebas T025, T026 y T027 juntas; T029 en paralelo con T028.
- US6: T042 y T043 juntas.
- Polish: T046, T047 y T048.

---

## Parallel Example: User Story 1

```text
# Pruebas de US1 juntas:
T012 tests/catalog/view.test.ts
T013 tests/catalog/load.test.ts
T014 tests/catalog/catalog-view.test.ts

# Componentes de US1 juntos (archivos distintos):
T017 src/components/CatalogHeader.astro
T018 src/components/CategoryChips.astro
T019 src/components/CatalogCard.astro
T020 src/components/CatalogMessage.astro
```

---

## Implementation Strategy

### MVP First

1. Setup + Foundational (T001 a T011): contacto, WhatsApp, categorías, consulta filtrada y layout
2. US1 (T012 a T024): **catálogo con filtro**; ya se puede compartir el enlace con los trabajos
3. US2 (T025 a T032): detalle y WhatsApp; con esto el catálogo ya genera contactos (condiciones 2 y 3 de "funcional" del PRD)
4. Validar y seguir

### Incremental Delivery

1. Foundational → base
2. US1 → catálogo → demo
3. US2 → detalle y WhatsApp → demo con el celular
4. US3 → pie
5. US4 → frescura comprobada con el panel
6. US5 → vista previa al compartir
7. US6 → errores y carga
8. Polish → celular real, Lighthouse, PR, despliegue y medición de CPU

### Notas

- Cada tarea debe terminar con `npm test` y `npm run check` en verde para lo que toca
- Todos los textos visibles, en español y exactos a la spec, al contrato y a los mockups ajustados (sin botón flotante, pie reducido)
- Contraste: texto nunca en `--rosa` (`#E85A9A`); usar `--rosa-oscuro` (`#B8326E`) (research D9)
- Commits en inglés (Conventional Commits) con `Refs: HU-NN`; una rama por cambio, PR a `main`
- El número de WhatsApp vive solo en `src/lib/site/contact.ts`; ninguna pantalla ni prueba (salvo las que verifican el valor de prueba actual) lo repite
