# Contrato: rutas HTTP de edición y retiro

Se suma a [las rutas de 003](../../003-panel-nuevo-trabajo/contracts/http-routes.md) y a [las de autenticación](../../002-admin-login/contracts/http-routes.md). El middleware existente ya exige sesión en `/admin/*` (303 a `/admin/login`) y en `/api/admin/*` (401), y `Origin` propio en cualquier método que modifica datos (403). Todas las rutas bajo `/admin` y `/api/admin` responden `Cache-Control: no-store`.

## `GET /admin` (cambios)

| Caso | Respuesta |
|---|---|
| Con trabajos activos | 200. Cada tarjeta suma, bajo la categoría, el enlace **"Editar"** (`/admin/works/{id}/edit`) y el botón **"Retirar"**. Los trabajos retirados no aparecen. Un único `<dialog>` modal compartido: título "¿Retirar este trabajo?", texto "Dejará de verse en el catálogo público.", botones "Cancelar" y "Retirar" |
| `?retirado=1` | Aviso "Trabajo retirado." (`role="status"`) |
| `?actualizado=1` | Aviso "Trabajo actualizado." |
| `?noDisponible=1` | Aviso "Ese trabajo ya no está disponible." |
| Retirar el último trabajo | Mensaje de lista vacía de 003 |

Si se combinan parámetros, solo se muestra un aviso, en el orden: `retirado`, `actualizado`, `noDisponible`. `?publicado=1` de 003 sigue igual.

## `GET /admin/works/new` (cambios)

Mismo formulario de 003 con el nuevo diseño: zona de foto (borde punteado dorado, ícono de cámara, "Toca para subir foto" y "Galería o cámara"), selector con primera opción **"Selecciona una categoría"**, placeholders **"Ej: Torta de Chocolate"** y **"Describe los ingredientes, tamaño, etc."**, asterisco rojo en Foto, Categoría y Título, y "(opcional)" en Descripción. Botón "Publicar".

## `GET /admin/works/{id}/edit`

Formulario de edición.

| Caso | Respuesta |
|---|---|
| Con sesión, `id` de un trabajo activo | 200. Cabecera "Editar trabajo"; mismo formulario que "Nuevo" precargado: foto actual como vista previa (`/media/…md`), categoría seleccionada, título y descripción. Campos ocultos `data-work-id` y `data-photo-version` (la `baseVersion`). Botón **"Guardar"** y enlace "Cancelar" a `/admin` |
| `id` que no es UUID, no existe o está retirado | **404** con la cabecera del panel, "Ese trabajo ya no está disponible." y botón "Volver a Mis trabajos" |
| Falla la base | 503 con mensaje sencillo y enlace a `/admin` |
| Sin sesión | 303 → `/admin/login` |

## `PUT /api/admin/works/{id}`

Actualiza un trabajo activo. Cuerpo `multipart/form-data`:

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `category` | texto (entero) | sí | id de `categories` |
| `title` | texto | **sí** | no vacío; ≤80 |
| `description` | texto | no | ≤1000; vacío la borra |
| `baseVersion` | texto (entero) | solo con foto nueva | `photo_version` que el navegador cargó |
| `original`, `sm`, `md`, `lg` | archivos | **todos o ninguno** | mismas reglas que en `POST /api/admin/works` |

El `id` del trabajo va solo en la ruta.

| Caso | Respuesta |
|---|---|
| Éxito (con o sin foto nueva) | **200** `{"id":"<uuid>","photoVersion":<n>}` |
| Reintento de un guardado con foto ya aplicado (`photo_version = baseVersion + 1`) | **200** con la versión actual, sin escribir de nuevo |
| Campo inválido o archivo rechazado (incluido título vacío y derivadas incompletas) | **422** `{"error":{"field":"<campo>","message":"<mensaje>"}}`. No cambia nada |
| `id` inválido, inexistente o retirado | **404** `{"error":{"field":"form","message":"Ese trabajo ya no está disponible."}}` |
| `baseVersion` no coincide con la versión actual | **409** `{"error":{"field":"form","message":"Este trabajo cambió. Recarga la página e inténtalo de nuevo."}}`. Lo escrito se deshace |
| Cuerpo no es `multipart/form-data` / demasiado grande | **400** / **413** como en 003 |
| Sin sesión / `Origin` ajeno | **401** / **403** (middleware) |
| Falla R2 o D1 | **503** `{"error":{"field":"form","message":"No pudimos guardar el trabajo. Intenta de nuevo."}}`; el trabajo conserva su foto y datos anteriores y lo escrito se deshace |

Efectos con foto nueva: se escriben las 4 claves de la versión `baseVersion + 1`; tras actualizar D1 se borran las 4 claves de la versión anterior (mejor esfuerzo; un fallo se registra en el log y no cambia la respuesta). `created_at` no cambia.

El `field` toma los mismos valores que en 003.

## `POST /api/admin/works/{id}/retire`

Retira un trabajo activo. Sin cuerpo (también acepta el envío del formulario HTML del diálogo).

| Caso | Respuesta con `Accept: application/json` | Respuesta de formulario HTML |
|---|---|---|
| Éxito | **200** `{"id":"<uuid>"}` | **303** → `/admin?retirado=1` |
| `id` inválido, inexistente o ya retirado | **404** `{"error":{"field":"form","message":"Ese trabajo ya no está disponible."}}` | **303** → `/admin?noDisponible=1` |
| Falla D1 | **503** `{"error":{"field":"form","message":"No pudimos retirar el trabajo. Intenta de nuevo."}}` | **303** → `/admin` (sin aviso; el trabajo sigue en la lista) |
| Sin sesión | **401** (middleware) | **303** → `/admin/login` |
| `Origin` ajeno o ausente | **403** (middleware) | **403** |

Retirar es idempotente desde el punto de vista del usuario: la segunda llamada no cambia nada y responde "no disponible". El trabajo conserva todos sus datos y archivos; solo se fija `retired_at`.

Métodos: `PUT` en `/api/admin/works/{id}` y `POST` en `…/retire`; cualquier otro responde 405 con `Allow`.

## `GET /media/works/{id}-{version}/{sm|md|lg}.{webp|jpg}` (sin cambios)

Sigue sirviendo con `Cache-Control: public, max-age=31536000, immutable`. Tras un reemplazo de foto la URL cambia porque `{version}` sube, por eso no hace falta invalidar caché. La versión anterior, una vez borrada, responde 404. Los trabajos retirados siguen sirviendo sus archivos si se conoce la URL (no hay sesión en esta ruta); aceptable por ser fotos pensadas para publicarse y por el ADR 0004 (no se borran).
