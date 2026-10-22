# Modelo de datos: Panel de trabajos y creación de trabajos

Esquema en `src/db/schema.ts` (Drizzle) y migración `migrations/0001_categories_and_works.sql`. Se suma a `sessions` y `login_attempts` de la funcionalidad 002.

## `categories`

Agrupación fija de trabajos. Las cuatro filas se insertan en la migración.

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | entero, clave primaria | 1 Tortas, 2 Postres, 3 Rollos, 4 Otros |
| `name` | texto, no nulo, único | nombre visible ("Tortas", "Postres", "Rollos", "Otros") |
| `position` | entero, no nulo | orden en el selector y, más adelante, en los chips |

## `works`

Un trabajo publicado.

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | texto, clave primaria | UUID generado por el navegador; validado con formato UUID. Hace idempotente el reintento |
| `category_id` | entero, no nulo, referencia `categories.id` | debe existir |
| `title` | texto, nulo | recortado; si queda vacío se guarda nulo; ≤80 caracteres |
| `description` | texto, nulo | recortado; si queda vacío se guarda nulo; ≤1000 caracteres |
| `photo_version` | entero, no nulo, valor 1 | cambiará al reemplazar la foto (Hito 5, HU-09) |
| `photo_ext` | texto, no nulo | `webp` o `jpg`; igual para las tres derivadas |
| `created_at` | entero, no nulo | milisegundos desde 1970 (UTC) en el momento de publicar |

**Índices**: `works_created_at_idx` en `created_at` (orden de la lista) y `works_category_id_idx` en `category_id` (filtro del catálogo, Hito 4), como pide el ADR 0003.

**Sin retiro todavía**: no hay columna de retiro. El borrado lógico (HU-10) la agregará con su propia migración.

## Archivos en R2 (bucket `samuele-media`)

Claves según el ADR 0004, con `v = photo_version`:

| Clave | Contenido | Acceso |
|---|---|---|
| `originals/{id}-{v}.jpg` | archivo tal cual lo subió la administradora (puede conservar EXIF) | privado, sin endpoint |
| `works/{id}-{v}/sm.{ext}` | miniatura (~400 px de ancho) | público por `/media/...` |
| `works/{id}-{v}/md.{ext}` | mediana (~900 px) | público por `/media/...` |
| `works/{id}-{v}/lg.{ext}` | grande (~1600 px) | público por `/media/...` |

## Relaciones y reglas

- Una categoría tiene muchos trabajos; un trabajo pertenece a exactamente una categoría.
- Un trabajo existe en D1 **solo si** sus cuatro archivos ya están en R2 (se escribe D1 al final; ver research D5).
- No hay transiciones de estado en esta funcionalidad: un trabajo se crea y queda publicado.

## Validaciones (servidor)

| Campo | Regla | Mensaje |
|---|---|---|
| `id` | UUID válido | "No pudimos publicar el trabajo. Intenta de nuevo." |
| `category` | entero que existe en `categories` | "Elige una categoría." |
| `title` | ≤80 caracteres tras recortar | "El título es muy largo (máximo 80 caracteres)." |
| `description` | ≤1000 caracteres tras recortar | "La descripción es muy larga (máximo 1000 caracteres)." |
| `original` | presente; ≤15 MB; JPEG, PNG o WebP por bytes | "Elige una foto." / "La foto pesa demasiado (máximo 15 MB)." / "Esa foto no tiene un formato admitido. Usa JPEG, PNG o WebP." |
| `sm`, `md`, `lg` | presentes; cada una ≤1 MB; WebP o JPEG por bytes, del mismo tipo entre sí; sin metadatos | "No pudimos preparar la foto. Intenta con otra." |
