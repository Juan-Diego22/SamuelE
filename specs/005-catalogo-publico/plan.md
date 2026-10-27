# Plan de implementación: Catálogo público y detalle de trabajo con WhatsApp

**Rama**: `feature/005-catalogo-publico` | **Fecha**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Entrada**: especificación en `specs/005-catalogo-publico/spec.md` (Hitos 4 y 5 del PRD: HU-01, HU-02, HU-03, HU-04, HU-05 reducida, HU-13, HU-15).

## Resumen

Se publica lo que ya existe en el panel:

1. **Catálogo (`/`)**: la página de inicio pasa de placeholder a catálogo renderizado en el servidor (SSR) leyendo D1 en cada visita. Cabecera compacta, chips de categorías como enlaces (`/?categoria=tortas`), grilla de tarjetas (2 columnas móvil, 3 desde tableta), "Ver más" sin JavaScript, estados vacío y de error, pie con WhatsApp.
2. **Detalle (`/trabajos/{id}`)**: foto grande (`md` y `lg` con `srcset`), categoría, título, descripción y "Preguntar por WhatsApp" con la frase ya escrita. Retirado o inexistente: 404 amable.
3. **Contacto centralizado**: `src/lib/site/contact.ts` guarda el número de WhatsApp y las frases; `src/lib/catalog/whatsapp.ts` arma los enlaces `wa.me`.
4. **Vista previa al compartir**: `BaseLayout` acepta descripción e imagen Open Graph; la portada usa un logo estático y cada detalle, su propia foto.
5. **Frescura**: sin caché propia (SSR + `Cache-Control: no-cache`): lo que cambia la administradora se ve en la siguiente visita (mejor que el plazo de 60 s de la spec).

Sin migraciones, sin dependencias nuevas, sin servicios nuevos. Una consulta de `listWorks` ganará filtro por categoría. Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6.0.x, Node 22 en desarrollo y CI; runtime `workerd`. Sin JavaScript de cliente salvo un script mínimo para "← Volver".

**Primary Dependencies**: las ya instaladas (Astro 7, `@astrojs/cloudflare`, `drizzle-orm`). Ninguna nueva.

**Storage**: D1 solo lectura (`works`, `categories`; sin cambios de esquema). Fotos desde `/media` (R2) ya servidas con caché inmutable.

**Testing**: Vitest 5 como en 003/004: lógica pura con almacén en memoria (`createMemoryWorksStore`), páginas con `AstroContainer`. WhatsApp real, vista previa, Lighthouse y CPU en celular y producción ([quickstart.md](quickstart.md)).

**Target Platform**: Cloudflare Workers (plan gratuito); cliente: Chrome Android y Safari iOS actuales, más escritorio.

**Project Type**: aplicación web de un solo Worker (SSR con Astro), la misma de 001 a 004.

**Performance Goals**: CPU por solicitud de `/` y de `/trabajos/{id}` ≤ 10 ms (se mide en producción, R1); Lighthouse móvil ≥ 90 en catálogo y detalle (SC-008); catálogo con 100 trabajos pesa lo mismo que con 24 (SC-010).

**Constraints**: costo $0; límite de 100.000 solicitudes/día del Worker, donde cada foto cuenta (R2 de research: ≈ 25 por visita inicial, miniaturas con `loading="lazy"`); ≤ 3 consultas D1 por solicitud; sin cuentas ni datos personales de visitantes.

**Scale/Scope**: decenas a cientos de trabajos, tráfico bajo (enlace compartido por WhatsApp); 1 página modificada (`/`), 1 nueva (`/trabajos/[id]`), 6 componentes, 2 módulos de lógica, 1 cambio de consulta.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Costo cero | Sin servicios nuevos; solo lecturas D1 (≤ 3/solicitud, límite 5 M filas/día) y lecturas R2 clase B (10 M/mes). Cuello: 100.000 solicitudes/día del Worker ≈ 4.000 visitas/día con 24 fotos; muy por encima del uso esperado, medido en R2 de research. | Pasa |
| II. Móvil primero y accesibilidad | Zonas táctiles ≥ 44 px (chips, tarjetas, botón); texto ≥ 16 px (el mockup trae 11–13 px, se sube); contraste ≥ 4.5:1: la categoría y el chip activo usan rosa oscuro `#B8326E`, no `#E85A9A` (R5); alt en todas las fotos; foco visible; `nav` con `aria-current`; prueba en celular real obligatoria. | Pasa |
| III. Privacidad y seguridad | Solo se sirven derivadas ya sin EXIF (ruta `/media` con lista blanca); no se exponen `retired_at`, originales ni IDs adicionales; título y descripción como texto (Astro escapa); `id` validado como UUID antes de consultar; el enlace `wa.me` usa `encodeURIComponent`; sin datos de visitantes. | Pasa |
| IV. Alcance disciplinado | Solo HU-01 a HU-05 y HU-13/15. Sin editar contacto desde el panel, sin buscador, sin botón flotante (decisión del negocio), sin categorías administrables. Pie reducido y sin flotante son recortes aprobados respecto al mockup. | Pasa |
| V. Calidad verificable | Pruebas enumeradas abajo, derivadas de los criterios de la spec; se reescribe `tests/home.test.ts`. | Pasa |
| VI. Entrega continua | PR con CI; sin migración. `lighthouserc.json` suma `/` con datos reales no aplica en CI (D1 vacía): el CI audita el estado vacío; el catálogo con datos se audita en producción (quickstart). | Pasa |
| VII. Decisiones y documentación | ADR nuevo 0009 (catálogo SSR sin caché, contacto en configuración, número de prueba); nota en ADR 0002 del resultado de CPU; README actualizado. Módulos pequeños bajo `src/lib/catalog` y `src/lib/site`. | Pasa |

Sin violaciones: Complexity Tracking no aplica.

**Re-evaluación tras el diseño (Fase 1)**: sin cambios. Riesgos abiertos en [research.md](research.md): R1 (CPU del SSR con 24 tarjetas), R2 (solicitudes por foto), R3 (vista previa de `webp` en WhatsApp/Instagram).

## Project Structure

### Documentación (esta funcionalidad)

```text
specs/005-catalogo-publico/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── http-routes.md
├── checklists/requirements.md
└── tasks.md          # lo genera /speckit-tasks
```

### Código fuente (raíz del repositorio)

```text
public/
└── og-logo.jpg                            # 600×600, vista previa de la portada (R3)
src/
├── lib/
│   ├── site/
│   │   └── contact.ts                     # SITE: nombre, lema, número, frases (único lugar a editar)
│   └── catalog/
│       ├── whatsapp.ts                    # normalizePhone, formatPhone, whatsappUrl, workMessage
│       ├── categories.ts                  # slug de categoría ↔ id, "Todos" y categoría desconocida
│       ├── view.ts                        # CatalogCard, toCatalogCards, paginación (pagina → límite, hayMas)
│       ├── detail.ts                      # DetailView (foto md/lg, alt, descripción, enlace de WhatsApp)
│       └── messages.ts                    # textos: vacío, categoría vacía, error, no disponible
│   └── works/
│       └── store.ts                       # listWorks(limit, categoryId?) + memoria
├── layouts/BaseLayout.astro               # + description, image, ogType, canonical; variante "catalog" (ancho)
├── components/
│   ├── CatalogHeader.astro                # logo + nombre + lema (compacto móvil, horizontal escritorio)
│   ├── CategoryChips.astro                # <nav> de enlaces, scroll horizontal, aria-current
│   ├── CatalogGrid.astro                  # <ul> de tarjetas (2/3 columnas)
│   ├── CatalogCard.astro                  # <a> único: foto sm, categoría, título y botón "Ver detalles"
│   ├── SiteFooter.astro                   # CONTACTO con WhatsApp y "Cotiza por WhatsApp"
│   ├── CatalogMessage.astro               # estado vacío, categoría vacía y error (con "Reintentar")
│   └── WorkDetail.astro                   # foto lg/md, etiqueta, título, descripción, botón, volver
├── scripts/
│   └── back-link.ts                       # "← Volver": history.back() si se vino del catálogo
├── pages/
│   ├── index.astro                        # catálogo (reemplaza el placeholder)
│   └── trabajos/[id].astro                # detalle (404 si no existe/retirado; 503 si falla)
└── styles/global.css                       # + catálogo, chips, tarjetas, pie, detalle, variante ancha
tests/
├── home.test.ts                           # se reescribe para el catálogo
└── catalog/
    ├── whatsapp.test.ts
    ├── categories.test.ts
    ├── view.test.ts
    ├── detail.test.ts
    ├── store-public.test.ts
    ├── catalog-page.test.ts
    └── detail-page.test.ts
```

**Decisión de estructura**: como en 002–004, la lógica vive en `src/lib/` sin importar `cloudflare:workers` (recibe `WorksStore`); solo las páginas leen `env`. Se **reutiliza** `getWork`, `listCategories` y `mediaUrl` de 003/004; no se toca el panel ni la ruta `/media`. `listWorks` gana un parámetro opcional de categoría, compatible con el panel (que no lo usa). El contacto no vive en una variable de entorno (el número no es secreto y así queda versionado y probado); se cambia editando `contact.ts` y desplegando.

### Estrategia de pruebas (principio V)

| Criterio de la spec | Dónde |
|---|---|
| Solo trabajos activos, más reciente primero (FR-006, SC-006) | `store-public.test.ts`, `view.test.ts` |
| Filtro por categoría; categoría desconocida = Todos (FR-004, edge case) | `categories.test.ts`, `catalog-page.test.ts` |
| Categorías sin trabajos visibles y con mensaje; estado vacío general (FR-005, FR-009) | `catalog-page.test.ts` |
| Tarjeta: foto `sm`, título o categoría de respaldo, enlace al detalle (FR-007) | `view.test.ts`, `catalog-page.test.ts` |
| Paginación 24 en 24 y "Ver más" (FR-011, SC-010) | `view.test.ts`, `catalog-page.test.ts` |
| Fallo de D1: mensaje sencillo, cabecera y pie, estado 503 (FR-010) | `catalog-page.test.ts` (almacén que falla) |
| Detalle: foto, etiqueta, título, descripción opcional, texto plano y saltos de línea (FR-012, FR-013) | `detail.test.ts`, `detail-page.test.ts` (descripción con `<b>`) |
| Retirado, inexistente o id inválido: 404 sin datos del trabajo (FR-015, SC-006) | `detail-page.test.ts` |
| Fallo de D1 en el detalle: 503 distinto del 404 (FR-016) | `detail-page.test.ts` |
| Normalización del número, formato legible y número inválido falla (FR-021) | `whatsapp.test.ts` (incluye validar `SITE.whatsapp`) |
| Frase prellenada con título, categoría de respaldo y caracteres especiales codificados (FR-018) | `whatsapp.test.ts`, `detail.test.ts` |
| Pie con WhatsApp y leyenda, sin teléfono, zona, anticipación ni precios; sin botón flotante (FR-017, FR-019, FR-023) | `catalog-page.test.ts` |
| Cambiar el número en `SITE` cambia detalle y pie (FR-020) | `detail.test.ts`, `catalog-page.test.ts` |
| Open Graph de portada y de detalle; retirado no expone foto ni título (FR-027, FR-028) | `catalog-page.test.ts`, `detail-page.test.ts` |
| Foto con alt, ancho/alto reservados, `loading="lazy"` fuera de la primera pantalla (FR-029, FR-030) | `catalog-page.test.ts` |
| Reemplazar foto cambia la URL (versión) (FR-025) | `view.test.ts` |
| Sin datos internos (`retired`, originales) en el HTML (FR-032) | `catalog-page.test.ts`, `detail-page.test.ts` |
| Enlaces de `wa.me` reales, vista previa, "Volver" con posición, columnas 2/3, sin desplazamiento horizontal, Lighthouse, CPU (FR-008, FR-014, FR-031, FR-033, SC-001 a SC-003, SC-005, SC-007 a SC-013) | Prueba manual en celular real y producción ([quickstart.md](quickstart.md)) |

## Complexity Tracking

Sin violaciones que justificar.
