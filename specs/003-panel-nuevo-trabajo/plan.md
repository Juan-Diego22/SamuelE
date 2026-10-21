# Plan de implementación: Panel de trabajos y creación de trabajos

**Rama**: `feature/003-panel-nuevo-trabajo` | **Fecha**: 2026-10-19 | **Spec**: [spec.md](spec.md)

**Entrada**: especificación en `specs/003-panel-nuevo-trabajo/spec.md` (Hito 3 del PRD, HU-07 y HU-08).

## Resumen

El panel `/admin` pasa de marcador a lista "Mis trabajos" (tarjetas con miniatura, título y categoría, más reciente primero, con estado vacío). Un botón lleva a `/admin/works/new`, un formulario con foto (galería o cámara), categoría, título y descripción. La foto se **optimiza en el navegador** (ADR 0005): se corrige la orientación, se dibujan tres anchos (400, 900 y 1600 px) y se re-codifican en WebP o JPEG, lo que elimina todo EXIF. El navegador envía la original y las tres derivadas en un solo `multipart/form-data` a `POST /api/admin/works`. El servidor valida sesión, `Origin`, campos, tamaños y tipo por bytes, comprueba que las derivadas no traen metadatos, escribe en R2 (ADR 0004) y después en D1. Si algo falla, borra lo escrito. Las fotos se sirven por `GET /media/works/...` desde el Worker, con caché inmutable.

Casi todo es decisión ya tomada en los ADR 0003, 0004 y 0005. La investigación ([research.md](research.md)) fija los detalles y señala una **corrección a la spec**: HEIC no se lista en el selector (iOS lo convierte a JPEG al elegir la foto), y la spec se ajustó en consecuencia.

## Technical Context

**Language/Version**: TypeScript 6.0.x, Node 22 en desarrollo y CI; runtime `workerd`. Un script de cliente (TypeScript empaquetado por Astro) para el formulario.

**Primary Dependencies**: las ya instaladas (Astro 7, `@astrojs/cloudflare`, `drizzle-orm`, `drizzle-kit`). Sin dependencias nuevas: el procesamiento usa `createImageBitmap` y `canvas` del navegador. `sharp` ya está instalado, pero **no** se usa aquí (no corre en Workers).

**Storage**: D1 (binding `DB`): tablas nuevas `categories` y `works` ([data-model.md](data-model.md)). R2 (binding nuevo `MEDIA`, bucket `samuele-media`): originales privadas y derivadas públicas por el Worker.

**Testing**: Vitest 5. Lógica pura (validación, tamaños, bytes mágicos, detección de metadatos, caso de uso con almacenes en memoria), middleware y páginas con `AstroContainer`. La parte de canvas se prueba en celular real ([quickstart.md](quickstart.md)).

**Target Platform**: Cloudflare Workers (plan gratuito); cliente: navegador móvil actual (Chrome Android, Safari iOS).

**Project Type**: aplicación web de un solo Worker (SSR con Astro), la misma de 001 y 002.

**Performance Goals**: crear un trabajo ≤1 min de punta a punta (SC-001); `POST /api/admin/works` ≤10 ms de CPU (se mide, ver riesgo R1); Lighthouse móvil ≥90 en las dos pantallas nuevas (SC-007).

**Constraints**: costo $0 recurrente; original ≤15 MB y cada derivada ≤1 MB (ADR 0005); ≤50 consultas D1 por invocación; el formulario **requiere JavaScript** (el procesamiento es del cliente), con aviso `noscript`.

**Scale/Scope**: una administradora y cientos de trabajos; 2 páginas (la lista reemplaza el marcador), 2 rutas de API/medios, 2 tablas y 1 migración con las 4 categorías iniciales.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Costo cero | D1 y R2 en capa gratuita (ADR 0003 y 0004). Un trabajo = 4 escrituras en R2 (clase A) y 1 inserción en D1; muy por debajo de 1 M/mes. R2 exige registrar medio de pago (ya aceptado en ADR 0004): requisito previo al despliegue, con alerta de facturación. | Pasa (con requisito previo) |
| II. Móvil primero y accesibilidad | Campos y botones ≥48 px, contraste ≥4.5:1 con la paleta del mockup, etiquetas asociadas, errores con `role="alert"`, vista previa con texto alternativo, uso solo con teclado. Prueba en celular real obligatoria (SC-008). | Pasa |
| III. Privacidad y seguridad | EXIF eliminado en el navegador y verificado en el servidor (rechaza derivadas con APP1/EXIF/XMP). Tipo por bytes, no por extensión. Original privada sin endpoint. Panel y API tras sesión y `Origin`. Texto del usuario escapado por Astro. | Pasa |
| IV. Alcance disciplinado | Solo HU-07 y HU-08, la lista y las categorías fijas necesarias. Sin editar, retirar, gestionar categorías ni catálogo público. La ruta `/media` es necesaria para ver las miniaturas (ADR 0004). | Pasa |
| V. Calidad verificable | Pruebas enumeradas en la estrategia (abajo), derivadas de los criterios de aceptación. | Pasa |
| VI. Entrega continua | Cambio por PR con CI. El despliegue ya aplica migraciones D1; se añade el bucket R2 al `wrangler.jsonc`. | Pasa |
| VII. Decisiones y documentación | Se actualizan ADR 0005 (aclarar HEIC y la verificación de metadatos en servidor) y README. Código en módulos pequeños bajo `src/lib/works/`. | Pasa |

Sin violaciones: la tabla de Complexity Tracking no aplica.

**Re-evaluación tras el diseño (Fase 1)**: sin cambios. No hay servicios ni dependencias fuera de los ADR. Riesgos abiertos: R1 (CPU al recibir ~4 MB de `multipart`) y R2 (calidad y tiempo de la optimización en el celular real), ambos en [research.md](research.md).

## Project Structure

### Documentación (esta funcionalidad)

```text
specs/003-panel-nuevo-trabajo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── http-routes.md
└── tasks.md          # lo genera /speckit-tasks
```

### Código fuente (raíz del repositorio)

```text
migrations/
└── 0001_categories_and_works.sql          # drizzle-kit + INSERT de las 4 categorías
src/
├── db/
│   └── schema.ts                          # + categories, works
├── lib/works/
│   ├── limits.ts                          # constantes: tamaños, anchos, largos de texto
│   ├── validate.ts                        # valida campos del formulario (texto y categoría)
│   ├── media.ts                           # tipo por bytes mágicos y detección de metadatos
│   ├── keys.ts                            # claves R2 según ADR 0004
│   ├── create.ts                          # caso de uso: valida, escribe R2, escribe D1, deshace si falla
│   ├── list.ts                            # lista para el panel (título de respaldo, orden)
│   ├── messages.ts                        # mensajes de error en lenguaje sencillo
│   └── store.ts                           # interfaces WorksStore y MediaStore + D1/R2 + memoria
├── lib/photo/                             # código de navegador, puro donde se puede
│   ├── plan.ts                            # anchos de salida y formato según tamaño y soporte (puro)
│   └── optimize.ts                        # createImageBitmap + canvas -> 3 Blob (solo navegador)
├── scripts/
│   └── work-form.ts                       # vista previa, validación, optimizar, enviar, errores
├── components/
│   ├── WorkCard.astro                     # tarjeta de la lista (miniatura, título, categoría)
│   ├── WorkForm.astro                     # formulario de nuevo trabajo
│   └── PanelHeader.astro                  # logo pequeño, título y "Salir" (mockup 4 y 5)
├── pages/
│   ├── admin/
│   │   ├── index.astro                    # "Mis trabajos": lista y estado vacío
│   │   └── works/new.astro                # formulario de nuevo trabajo
│   ├── api/admin/
│   │   └── works.ts                       # POST: crea el trabajo
│   └── media/
│       └── [...path].ts                   # GET: sirve works/* desde R2 (originals/ -> 404)
└── env.d.ts                               # + binding MEDIA
tests/
└── works/                                 # validate, media, keys, create, list, photo-plan,
                                           # works-api, media-route, admin-index, new-page
wrangler.jsonc                             # + r2_buckets "MEDIA" -> samuele-media
```

**Decisión de estructura**: igual que en 002, la lógica vive en `src/lib/works/` sin importar `cloudflare:workers` (recibe los almacenes por parámetro) para probarla en Node. Solo el middleware, las páginas y las rutas leen `env` y construyen los almacenes de D1 y R2. El código que depende del navegador (`optimize.ts`, `work-form.ts`) se aísla; lo que se puede decidir sin navegador (`plan.ts`) es puro y testeable.

### Estrategia de pruebas (principio V)

| Criterio de la spec | Dónde |
|---|---|
| Foto y categoría obligatorias; título y descripción opcionales (FR-005, FR-009) | `validate.test.ts`, `works-api.test.ts` |
| Largo máximo y texto plano (FR-020) | `validate.test.ts`, `admin-index.test.ts` (escapado de `<script>`) |
| Tipo por bytes; archivo no imagen o extensión falsa rechazado (FR-010, SC-005) | `media.test.ts` |
| Tamaño máximo de original y derivadas (FR-011) | `media.test.ts`, `works-api.test.ts` |
| Derivadas con metadatos rechazadas (FR-013, SC-003) | `media.test.ts` con JPEG y WebP de prueba que llevan EXIF con GPS |
| Tres derivadas obligatorias; nada publicado a medias (FR-012, FR-014) | `create.test.ts` con almacenes que fallan en cada paso |
| Envío duplicado crea un solo trabajo (FR-016) | `create.test.ts` (mismo identificador dos veces) |
| Lista: orden, título de respaldo, estado vacío (FR-002, FR-003) | `list.test.ts`, `admin-index.test.ts` |
| Sin sesión: redirección o 401 (FR-019, SC-009) | `middleware.test.ts` (ampliado) y `works-api.test.ts` |
| `Origin` ajeno rechazado en `POST /api/admin/works` | `works-api.test.ts` |
| `/media` sirve derivadas con caché inmutable; `originals/` y claves ajenas dan 404 | `media-route.test.ts` |
| Anchos y formato de salida (FR-012) | `photo-plan.test.ts` |
| Orientación, vista previa, cámara, tiempo (<1 min), calidad visual (FR-006, FR-007, SC-001, SC-008) | Prueba manual en celular real ([quickstart.md](quickstart.md)); `createImageBitmap` y canvas no corren en Node |

## Complexity Tracking

Sin violaciones que justificar.
