# Plan de implementación: Editar y retirar los trabajos del panel

**Rama**: `feature/004-editar-retirar-trabajos` | **Fecha**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Entrada**: especificación en `specs/004-editar-retirar-trabajos/spec.md` (Hito 5 del PRD, HU-09 y HU-10, más el rediseño de la zona de foto del formulario).

## Resumen

Se completa el ciclo de vida de un trabajo sobre lo construido en 003:

1. **Retirar**: cada tarjeta muestra "Editar" y "Retirar". "Retirar" abre un `<dialog>` modal nativo ("¿Retirar este trabajo?") que envía `POST /api/admin/works/{id}/retire`. El retiro es un borrado lógico (`works.retired_at`); la lista excluye los retirados y los archivos de R2 se conservan (ADR 0004).
2. **Editar**: la página `/admin/works/{id}/edit` reutiliza `WorkForm` precargado. `PUT /api/admin/works/{id}` actualiza los textos y la categoría; si hay foto nueva, escribe una **versión nueva** en R2 (`photo_version + 1`), actualiza D1 con una condición sobre la versión anterior y recién entonces borra la versión vieja. Como la URL de la foto incluye la versión, el navegador nunca ve la foto anterior (FR-014) a pesar del caché inmutable.
3. **Formulario**: la zona de foto pasa a ser un `<label>` táctil con borde punteado dorado, ícono de cámara en SVG propio, "Toca para subir foto" y "Galería o cámara"; se añaden placeholders, la opción inicial "Selecciona una categoría" y asteriscos rojos. El **título pasa a ser obligatorio** (también en "Nuevo"), validado en cliente y servidor.

Sin dependencias nuevas, sin servicios nuevos, una migración de una columna. Detalle de decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6.0.x, Node 22 en desarrollo y CI; runtime `workerd`. Script de cliente empaquetado por Astro.

**Primary Dependencies**: las ya instaladas (Astro 7, `@astrojs/cloudflare`, `drizzle-orm`, `drizzle-kit`). Ninguna nueva. El diálogo usa el elemento HTML `<dialog>` del navegador.

**Storage**: D1 (`works` gana `retired_at`), R2 sin cambios de bucket: se escriben claves con la versión nueva y se borran las de la versión anterior ([data-model.md](data-model.md)).

**Testing**: Vitest 5, igual que 003: lógica pura con almacenes en memoria, rutas con los manejadores `handle*` y páginas con `AstroContainer`. Diálogo, zona de foto y reemplazo real de foto se prueban en celular ([quickstart.md](quickstart.md)).

**Target Platform**: Cloudflare Workers (plan gratuito); cliente: Chrome Android y Safari iOS actuales.

**Project Type**: aplicación web de un solo Worker (SSR con Astro), la misma de 001 a 003.

**Performance Goals**: `PUT` sin foto y `POST …/retire` ≤ 10 ms de CPU (una o dos consultas D1); `PUT` con foto igual al `POST` de 003 (R1, se mide); Lighthouse móvil ≥ 90 en lista y formulario (SC-010).

**Constraints**: costo $0 recurrente; mismos límites de foto y texto de 003; ≤ 50 consultas D1 por invocación (aquí ≤ 4); el formulario requiere JavaScript (como 003); el retiro funciona incluso sin JavaScript (formulario HTML con respaldo).

**Scale/Scope**: una administradora y cientos de trabajos; 1 página nueva (edición), 2 rutas de API nuevas, 1 migración, 3 componentes nuevos o modificados.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Costo cero | Sin servicios nuevos. Editar con foto = 4 escrituras R2 clase A + 1 borrado (gratis) + 1 `UPDATE` D1; retirar = 1 `UPDATE` D1. Muy por debajo de los límites gratuitos. | Pasa |
| II. Móvil primero y accesibilidad | Botones, zona de foto y botones del diálogo ≥ 44 px; contraste ≥ 4.5:1 (placeholders y asterisco incluidos, se verifican); `<dialog>` modal nativo (foco atrapado, Escape, foco de regreso); ícono con `aria-hidden`; etiquetas visibles; foco visible en la zona de foto; prueba en celular real obligatoria. | Pasa |
| III. Privacidad y seguridad | La foto nueva pasa por el mismo `validateOriginal`/`validateDerivatives` (tipo por bytes, tamaño, sin EXIF/GPS). Rutas tras sesión y `Origin` propio (middleware ya cubre `PUT` y `POST`). `id` validado como UUID; texto como texto plano. El original anterior se borra al reemplazar. | Pasa |
| IV. Alcance disciplinado | Solo HU-09, HU-10 y lo pedido para el formulario. Sin detalle (es del catálogo), sin restaurar, sin limpieza física de retirados, sin gestión de categorías. El título obligatorio es un cambio de alcance **aprobado por la usuaria** en esta spec. | Pasa |
| V. Calidad verificable | Pruebas enumeradas abajo, derivadas de los criterios de aceptación; se actualizan las de 003 que publican sin título. | Pasa |
| VI. Entrega continua | PR con CI; el despliegue ya aplica migraciones D1 (`0002`). | Pasa |
| VII. Decisiones y documentación | ADR 0004 ya decide "retiro = borrado lógico, sin borrar archivos" (se cumple). Se añade una nota en ADR 0005 sobre reemplazo de foto y se actualiza el README. Código en módulos pequeños bajo `src/lib/works/`. | Pasa |

Sin violaciones: la tabla de Complexity Tracking no aplica.

**Re-evaluación tras el diseño (Fase 1)**: sin cambios. Riesgos abiertos: R1 (CPU de `PUT` con foto, mismo perfil que `POST` de 003) y R3 (borrado de la versión anterior es de mejor esfuerzo y puede dejar huérfanos), en [research.md](research.md).

## Project Structure

### Documentación (esta funcionalidad)

```text
specs/004-editar-retirar-trabajos/
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
└── 0002_works_retired_at.sql              # drizzle-kit: ADD COLUMN retired_at
src/
├── db/schema.ts                           # + works.retiredAt
├── lib/works/
│   ├── limits.ts                          # (sin cambios)
│   ├── messages.ts                        # + titleMissing, notAvailable, retireFailed, texto de ayuda
│   ├── validate.ts                        # título obligatorio; validateEditFields (sin id nuevo)
│   ├── store.ts                           # + getWork, updateWork, retireWork; listWorks excluye retirados
│   ├── create.ts                          # usa título obligatorio (sin otros cambios)
│   ├── update.ts                          # caso de uso: valida, versión nueva en R2, D1 condicional, borra la vieja
│   ├── retire.ts                          # caso de uso: marca retired_at (idempotente)
│   ├── api.ts                             # + handleUpdateWork, handleRetireWork (comparten lectura de multipart)
│   ├── list.ts                            # + editHref en PanelItem
│   └── edit-view.ts                       # datos del formulario de edición (valores y URL de la foto actual)
├── components/
│   ├── CameraIcon.astro                   # SVG de cámara, aria-hidden
│   ├── PhotoDrop.astro                    # zona de foto: label táctil + vista previa + error
│   ├── WorkForm.astro                     # modo nuevo/edición, placeholders, asteriscos, "Selecciona una categoría"
│   ├── NewWorkView.astro                  # (sin cambios de comportamiento)
│   ├── EditWorkView.astro                 # cabecera "Editar trabajo" + WorkForm precargado / no disponible
│   ├── WorkCard.astro                     # + botones Editar y Retirar
│   ├── RetireDialog.astro                 # <dialog> "¿Retirar este trabajo?"
│   └── WorksPanel.astro                   # + RetireDialog y avisos (retirado, actualizado, no disponible)
├── scripts/
│   ├── work-form.ts                       # modo nuevo/edición: foto opcional en edición, título obligatorio
│   └── retire-dialog.ts                   # abre el diálogo, envía el retiro, muestra errores
├── pages/
│   ├── admin/
│   │   ├── index.astro                    # + avisos ?retirado=1, ?actualizado=1, ?noDisponible=1
│   │   └── works/[id]/edit.astro          # formulario de edición (404 si no existe o está retirado)
│   └── api/admin/works/
│       ├── [id].ts                        # PUT: actualiza el trabajo
│       └── [id]/retire.ts                 # POST: retira el trabajo
├── styles/global.css                       # zona de foto, asteriscos, .sr-only, botones de tarjeta, diálogo
tests/
└── works/                                 # + update, retire, store-retire, edit-page, retire-api,
                                           #   update-api; se amplían validate, create, list, admin-index, new-page
```

**Decisión de estructura**: igual que en 002 y 003, la lógica vive en `src/lib/works/` sin importar `cloudflare:workers` (recibe los almacenes por parámetro) para probarla en Node; solo las páginas y rutas leen `env`. `WorkForm` sirve a "Nuevo" y "Editar" con una propiedad opcional `work`, para no duplicar la zona de foto ni los campos. `works.ts` (creación) se mueve sin cambios de contrato; las rutas nuevas viven en la carpeta `works/`. Como `src/pages/api/admin/works.ts` y la carpeta `works/` coexisten en Astro, la ruta de creación se mantiene como `works.ts` y solo se añaden `[id].ts` y `[id]/retire.ts`.

### Estrategia de pruebas (principio V)

| Criterio de la spec | Dónde |
|---|---|
| Retirar marca el trabajo y lo excluye de la lista (FR-004, FR-005, SC-003) | `retire.test.ts`, `list.test.ts`, `store-retire.test.ts` |
| Retirar dos veces o un id inexistente no falla de forma confusa (FR-007) | `retire.test.ts`, `retire-api.test.ts` |
| Fallo al retirar conserva el trabajo (FR-008) | `retire.test.ts` (almacén que falla) |
| Sin sesión o `Origin` ajeno: redirección, 401 o 403 (FR-029, SC-011) | `retire-api.test.ts`, `update-api.test.ts`, `middleware.test.ts` |
| Tarjeta con Editar y Retirar; diálogo con texto y botones exactos (FR-001, FR-002) | `admin-index.test.ts` |
| Editar textos o categoría sin foto no toca R2 (FR-011, FR-012) | `update.test.ts` (almacén que cuenta escrituras) |
| Foto nueva: mismas validaciones que al publicar y sin metadatos (FR-013, SC-005) | `update.test.ts`, `update-api.test.ts` con JPEG/WebP con EXIF/GPS |
| Versión nueva, URL nueva y borrado de la versión vieja (FR-014, SC-006) | `update.test.ts`, `list.test.ts` (URL con versión) |
| Todo o nada: fallo en R2 o D1 conserva la foto y los datos anteriores (FR-015, SC-007) | `update.test.ts` con almacenes que fallan en cada paso |
| Reintento tras éxito y doble envío no duplican la versión (FR-017) | `update.test.ts` (misma `baseVersion` dos veces) |
| Conserva fecha de creación y lugar en la lista (FR-016) | `update.test.ts`, `list.test.ts` |
| Trabajo inexistente o retirado en la página de edición y en el `PUT` (FR-019) | `edit-page.test.ts`, `update-api.test.ts` |
| Título obligatorio, solo espacios, límites (FR-028, escenarios 6 de las historias 2 y 3) | `validate.test.ts`, `works-api.test.ts` (se actualizan los casos de 003 sin título) |
| Zona de foto, placeholders, opción inicial y asteriscos (FR-020 a FR-027) | `new-page.test.ts` y `edit-page.test.ts` (HTML renderizado con `AstroContainer`) |
| Ícono con `aria-hidden`, etiquetas conservadas, texto "obligatorio" para lectores (FR-023, FR-025, FR-027) | `new-page.test.ts` |
| Foco del diálogo, Escape, vista previa, cámara/galería, calidad, tiempos (FR-006, FR-021, FR-022, SC-001, SC-004, SC-008, SC-009) | Prueba manual en celular real ([quickstart.md](quickstart.md)); `<dialog>` y `canvas` no corren en Node |

## Complexity Tracking

Sin violaciones que justificar.
