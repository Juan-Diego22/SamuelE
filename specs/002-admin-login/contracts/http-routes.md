# Contrato: rutas HTTP de autenticación

Interfaz que la funcionalidad expone. Todas las rutas bajo `/admin` y `/api/admin` responden `Cache-Control: no-store`.

## Reglas del middleware

Orden de evaluación para cada petición:

1. Si la ruta no está bajo `/admin` ni `/api/admin`: pasa sin cambios (sitio público intacto, FR-021).
2. Si el método es distinto de `GET`, `HEAD` y `OPTIONS` y el encabezado `Origin` falta o no coincide con el origen del sitio: **403** (FR-012). Aplica también a `POST /admin/login`.
3. Si la ruta es `/admin/login`: pasa. Con sesión válida, `GET` redirige a `/admin` (303).
4. Si la ruta está bajo `/admin`: sin sesión válida → **303** a `/admin/login`.
5. Si la ruta está bajo `/api/admin`: sin sesión válida → **401** `{"error":"unauthorized"}`.
6. Con sesión válida: pasa, con `locals.session` disponible.

Sesión válida = cookie de sesión presente, con hash SHA-256 que existe en `sessions` y `expires_at` en el futuro. Un error de la base al validar cuenta como sesión no válida (falla cerrada).

## `GET /admin/login`

| Caso | Respuesta |
|---|---|
| Sin sesión | 200, HTML del formulario (logo, "Panel de trabajos", correo, contraseña, "Ingresar"). |
| Con sesión válida | 303 → `/admin`. |

## `POST /admin/login`

Cuerpo `application/x-www-form-urlencoded`: `email`, `password`.

| Caso | Respuesta |
|---|---|
| Algún campo vacío | 200, mismo formulario con "Completa tu correo y tu contraseña." No consulta credenciales ni cuenta como fallo. |
| Credenciales correctas, sin bloqueo | 303 → `/admin`; `Set-Cookie` de sesión; se borran los fallos. |
| Correo o contraseña incorrectos (cualquier combinación) | 200, mismo formulario con **"Correo o contraseña incorrectos."**; se registra un fallo. Respuesta idéntica en ambos casos. |
| Bloqueo activo (con o sin credenciales correctas) | 429, mismo formulario con **"Demasiados intentos. Intenta de nuevo en 15 minutos."**; no se evalúan las credenciales ni se registra nada. |
| Falla la base de datos | 503, mismo formulario con "No pudimos iniciar sesión, intenta de nuevo en unos minutos"; no se concede acceso. |
| Faltan `ADMIN_EMAIL` o `ADMIN_PASSWORD` | Se trata como credenciales incorrectas (falla cerrada); se deja un aviso en el registro del Worker. |

Cookie de sesión: `__Host-session=<token base64url>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`.

## `GET /admin` y `GET /admin/*`

Con sesión: `/admin` devuelve 200 con el título "Panel de trabajos" y el botón "Salir". Cualquier otra ruta bajo `/admin` con sesión devuelve el 404 habitual del sitio. Sin sesión, todas redirigen según la regla 4.

## `POST /api/admin/logout`

| Caso | Respuesta |
|---|---|
| Con sesión | Borra la fila de `sessions`, expira la cookie (`Max-Age=0`), 303 → `/admin/login`. |
| Sin sesión | 401 (regla 5). |
| `Origin` ajeno | 403 (regla 2). |

## Pruebas de contrato

Cada fila de las tablas anteriores corresponde a al menos una prueba (`tests/auth/middleware.test.ts`, `tests/auth/login.test.ts` y pruebas de página).
