# Modelo de datos: Editar y retirar los trabajos del panel

Esquema en `src/db/schema.ts` (Drizzle) y migración `migrations/0002_works_retired_at.sql`. Se suma al modelo de [003](../003-panel-nuevo-trabajo/data-model.md).

## `works` (cambio)

Una sola columna nueva; las demás no cambian.

| Columna | Tipo | Reglas |
|---|---|---|
| `retired_at` | entero, **nulo** | `NULL` = activo. Milisegundos desde 1970 (UTC) del momento del retiro. Una vez puesto, no se vuelve a `NULL` en esta funcionalidad |

La migración es `ALTER TABLE works ADD retired_at integer;` (sin valor por defecto: las filas existentes quedan activas). No se añade índice (ver [research.md](research.md) D1).

**Columnas que cambian de significado**:

| Columna | Antes (003) | Ahora (004) |
|---|---|---|
| `title` | opcional; nulo si queda vacío | **obligatorio en toda escritura nueva** (≤80 caracteres, recortado, no vacío). La columna sigue admitiendo nulo por las filas antiguas de 003 |
| `photo_version` | siempre 1 | sube en 1 cada vez que se reemplaza la foto; forma parte de las claves de R2 y de la URL pública |
| `photo_ext` | `webp` o `jpg` | se actualiza con cada reemplazo (puede cambiar de extensión) |
| `created_at` | momento de publicar | **no cambia** al editar (FR-016) |

## Estados de un trabajo

```text
(publicar) ──► activo ──(editar)──► activo
                 │
            (retirar)
                 ▼
             retirado   (final: sin restaurar, sin borrado físico)
```

- **Activo**: `retired_at IS NULL`. Aparece en la lista, se puede editar y retirar.
- **Retirado**: `retired_at` con fecha. No aparece en la lista, la edición responde "no disponible", y el futuro catálogo debe filtrarlo con la misma condición.
- Retirar un trabajo retirado o inexistente no es un error de servidor: se trata como "no disponible".

## Archivos en R2 (bucket `samuele-media`)

Sin cambios de estructura. Claves según el ADR 0004, con `v = photo_version`:

| Clave | Contenido | Ciclo de vida en 004 |
|---|---|---|
| `originals/{id}-{v}.jpg` | archivo tal cual lo subió la administradora | se escribe con cada foto nueva; al reemplazarla, **se borra la de la versión anterior** |
| `works/{id}-{v}/{sm,md,lg}.{ext}` | miniatura, mediana y grande, sin metadatos | igual: se escribe la versión nueva completa y, tras confirmar en D1, se borra la anterior |

Al **retirar** no se borra nada de R2 (ADR 0004). Una versión anterior que no se pudo borrar queda huérfana (riesgo R3).

## Relaciones y reglas

- Una categoría tiene muchos trabajos; un trabajo pertenece a una categoría y **puede cambiarla** al editarse (debe existir).
- Un trabajo activo siempre tiene sus cuatro archivos de la versión actual en R2: la versión nueva se escribe completa **antes** de actualizar D1 y la anterior se borra **después**.
- `UPDATE` de edición con foto: `WHERE id = ? AND retired_at IS NULL AND photo_version = {baseVersion}`; si no cambia ninguna fila se deshace lo escrito.

## Validaciones (servidor)

Mismas que en 003, con estos cambios:

| Campo | Regla | Mensaje |
|---|---|---|
| `title` | **obligatorio**; ≤80 caracteres tras recortar | "Escribe un título." / "El título es muy largo (máximo 80 caracteres)." |
| `category` | entero que existe en `categories` | "Elige una categoría." |
| `description` | opcional; ≤1000 caracteres tras recortar | "La descripción es muy larga (máximo 1000 caracteres)." |
| `id` (ruta) | UUID válido y trabajo activo | "Ese trabajo ya no está disponible." (404) |
| `baseVersion` | entero ≥ 1, **obligatorio solo si hay foto nueva**; igual a la `photo_version` actual (o una menos si es un reintento ya aplicado) | "Este trabajo cambió. Recarga la página e inténtalo de nuevo." (409) |
| `original`, `sm`, `md`, `lg` | **todos o ninguno**. Si vienen: mismas reglas de 003 (tipo por bytes, ≤15 MB / ≤1 MB, sin metadatos, mismo tipo entre derivadas) | los de 003; si vienen incompletos: "No pudimos preparar la foto. Intenta con otra." |

## Mensajes nuevos (`src/lib/works/messages.ts`)

| Clave | Texto |
|---|---|
| `titleMissing` | "Escribe un título." |
| `notAvailable` | "Ese trabajo ya no está disponible." |
| `conflict` | "Este trabajo cambió. Recarga la página e inténtalo de nuevo." |
| `retireFailed` | "No pudimos retirar el trabajo. Intenta de nuevo." |
| `retired` / `updated` | "Trabajo retirado." / "Trabajo actualizado." (avisos de la lista) |

`ErrorField` no cambia (`category`, `title`, `description`, `original`, `photo`, `form`).
