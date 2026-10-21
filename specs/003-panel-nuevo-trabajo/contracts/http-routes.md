# Contrato: rutas HTTP del panel de trabajos

Interfaz que la funcionalidad expone. Se suma a [las rutas de autenticación](../../002-admin-login/contracts/http-routes.md): el middleware existente ya exige sesión en `/admin/*` (303 a `/admin/login`) y en `/api/admin/*` (401), y `Origin` propio en métodos que modifican datos (403). Todas las rutas bajo `/admin` y `/api/admin` responden `Cache-Control: no-store`.

## `GET /admin`

Pantalla "Mis trabajos" (mockup 4).

| Caso | Respuesta |
|---|---|
| Con sesión, con trabajos | 200. Cabecera (logo, título, "Salir"), botón "+ Nuevo trabajo" y una tarjeta por trabajo: miniatura (`/media/...sm`) con texto alternativo, título (o categoría si no tiene) y categoría. Más reciente primero, hasta 200. |
| Con sesión, sin trabajos | 200. Mensaje: "Todavía no tienes trabajos. Publica el primero." y el botón "+ Nuevo trabajo". |
| Con `?publicado=1` | Se agrega el aviso "Trabajo publicado." (`role="status"`). |
| Falla la base | 503 con "No pudimos cargar tus trabajos. Intenta de nuevo en unos minutos." y el botón "+ Nuevo trabajo" sigue disponible. |
| Sin sesión | 303 → `/admin/login` (middleware). |

## `GET /admin/works/new`

Formulario de nuevo trabajo (mockup 5).

| Caso | Respuesta |
|---|---|
| Con sesión | 200. Cabecera con título "Nuevo trabajo", campo de foto con vista previa, selector de categoría (las 4 de D1), título, descripción, botón "Publicar" y enlace "Cancelar" a `/admin`. `<noscript>` avisa que se necesita JavaScript. |
| Falla la base al leer categorías | 503 con mensaje sencillo y enlace a `/admin`. |
| Sin sesión | 303 → `/admin/login`. |

## `POST /api/admin/works`

Crea un trabajo. Cuerpo `multipart/form-data`:

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | texto (UUID) | sí | lo genera el navegador; idempotencia |
| `category` | texto (entero) | sí | id de `categories` |
| `title` | texto | no | ≤80 |
| `description` | texto | no | ≤1000 |
| `original` | archivo | sí | ≤15 MB; JPEG, PNG o WebP |
| `sm`, `md`, `lg` | archivo | sí | ≤1 MB cada uno; WebP o JPEG sin metadatos |

| Caso | Respuesta |
|---|---|
| Éxito | **201** `{"id":"<uuid>"}` |
| Reintento con un `id` ya creado | **201** `{"id":"<uuid>"}` (sin escribir de nuevo) |
| Campo inválido o archivo rechazado | **422** `{"error":{"field":"<campo>","message":"<mensaje>"}}` con el mensaje de [data-model.md](../data-model.md). Nada queda guardado |
| Cuerpo no es `multipart/form-data` o demasiado grande | **400** / **413** con `{"error":{"field":"form","message":"..."}}` |
| Sin sesión | **401** `{"error":"unauthorized"}` (middleware) |
| `Origin` ajeno o ausente | **403** (middleware) |
| Falla R2 o D1 | **503** `{"error":{"field":"form","message":"No pudimos guardar el trabajo. Intenta de nuevo."}}`; lo escrito se deshace |

El campo `field` toma uno de: `category`, `title`, `description`, `original`, `photo` (derivadas) o `form`; el cliente lo usa para mostrar el mensaje junto al campo.

## `GET /media/works/{id}-{version}/{sm|md|lg}.{webp|jpg}`

Sirve una derivada desde R2. Pública (sin sesión), fuera de `/admin`.

| Caso | Respuesta |
|---|---|
| Existe | 200, `Content-Type` `image/webp` o `image/jpeg`, `Cache-Control: public, max-age=31536000, immutable` |
| No existe | 404 |
| Ruta que no cumple la forma anterior, o que empieza por `originals/` | 404, sin consultar R2 |
| Falla R2 | 502 sin cuerpo útil; no se cachea |

`GET` y `HEAD` únicamente; otros métodos responden 405.
