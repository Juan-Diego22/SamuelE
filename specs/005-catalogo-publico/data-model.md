# Modelo de datos: Catálogo público y detalle de trabajo con WhatsApp

**No hay migración ni columnas nuevas.** La funcionalidad lee `works` y `categories` (003/004) y agrega vistas en memoria y una configuración de contacto.

## Datos leídos

| Tabla | Columnas usadas | Regla |
|---|---|---|
| `works` | `id`, `category_id`, `title`, `description`, `photo_version`, `photo_ext`, `created_at`, `retired_at` | Solo filas con `retired_at IS NULL`; más reciente primero (`created_at DESC`) |
| `categories` | `id`, `name`, `position` | Orden por `position`; son las 4 fijas |

**Consulta nueva**: `listWorks(limit, categoryId?)` agrega `AND category_id = ?` cuando hay categoría. Usa `works_category_id_idx` y `works_created_at_idx`. `getWork(id)` del detalle ya existe y excluye retirados.

## Vistas (no se persisten)

### Categoría pública
| Campo | Origen |
|---|---|
| `slug` | nombre en minúsculas sin tildes (`Tortas` → `tortas`) |
| `name` | `categories.name` |
| `href` | `/?categoria={slug}` (la de "Todos": `/`) |
| `active` | coincide con el filtro actual |

Filtro inválido o ausente → "Todos". Ninguna categoría se oculta, haya o no trabajos (decisión de la spec).

### Tarjeta del catálogo (`CatalogCard`)
| Campo | Origen |
|---|---|
| `href` | `/trabajos/{id}` |
| `title` | `title`; si es nulo, el nombre de la categoría |
| `category` | `categories.name` |
| `photoUrl` | `mediaUrl(id, photo_version, "sm", photo_ext)` (cambia al reemplazar la foto) |
| `alt` | `{title} — {category}` |

### Página del catálogo
| Campo | Regla |
|---|---|
| `page` | entero ≥ 1 de `?pagina`; inválido → 1; tope 8 |
| `pageSize` | 24 |
| `items` | primeros `24 × page` trabajos del filtro |
| `hasMore` | se pidieron `24 × page + 1` y llegó el extra |
| `state` | `items` · `empty` (no hay trabajos) · `emptyCategory` (filtro sin trabajos) · `error` |

### Detalle (`DetailView`)
| Campo | Origen |
|---|---|
| `title` | `title` o categoría |
| `category` | `categories.name` |
| `description` | `description` o ausente; texto plano con saltos de línea |
| `photoMd`, `photoLg` | `mediaUrl(…, "md" / "lg", photo_ext)` |
| `alt` | `{title} — {category}` |
| `whatsappUrl` | `whatsappUrl(SITE.whatsapp, workMessage(title))` |

## Configuración de contacto (`src/lib/site/contact.ts`)

| Campo | Valor de esta entrega | Notas |
|---|---|---|
| `name` | `Samuelé Repostería` | |
| `tagline` | `Creamos momentos dulces` | |
| `whatsapp` | `+57 3XX XXX XXXX` | Admite espacios, `+`, guiones; se usan solo los dígitos (`57XXXXXXXXXX`); 8–15 dígitos; prueba que lo valida |
| `messages.general` | `Hola Samuelé, vi su catálogo y quiero más información.` | Enlace del pie |
| `messages.work` | `Hola Samuelé, me interesa el trabajo "{title}". ¿Me puedes dar más información?` | `{title}` = título o categoría |
| `footerNote` | `Cotiza por WhatsApp` | Leyenda del pie (sin precios) |

No es secreto y se versiona. Pasar al número real de la administradora = cambiar `whatsapp` (SC-004).

## Mensajes (`src/lib/catalog/messages.ts`)

| Clave | Texto |
|---|---|
| `empty` | "Estamos preparando nuestro catálogo. Muy pronto verás aquí nuestros trabajos." |
| `emptyCategory` | "Todavía no hay trabajos en esta categoría." (con enlace "Ver todos") |
| `loadFailed` | "No pudimos cargar los trabajos. Intenta de nuevo en un momento." (con "Reintentar") |
| `detailUnavailable` | "Este trabajo ya no está disponible." (con "Ver el catálogo") |
| `detailFailed` | "No pudimos cargar este trabajo. Intenta de nuevo en un momento." (con "Reintentar" y "Ver el catálogo") |
| `loadMore` | "Ver más trabajos" |

## Relaciones y estados

- Trabajo → Categoría (muchos a uno, como en 003).
- Un trabajo es visible públicamente mientras `retired_at` sea nulo; al retirarlo pasa de "visible" a "no disponible" (404) en la siguiente visita. No hay otros estados.
- Al reemplazar la foto, `photo_version` sube y la URL de `sm`/`md`/`lg` cambia: ninguna vista pública muestra la anterior (FR-025).
