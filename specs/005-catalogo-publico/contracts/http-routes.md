# Contrato: rutas HTTP públicas del catálogo

Se suma a las rutas de [002](../../002-admin-login/contracts/http-routes.md), [003](../../003-panel-nuevo-trabajo/contracts/http-routes.md) y [004](../../004-editar-retirar-trabajos/contracts/http-routes.md). Las rutas son **públicas** (sin sesión; el middleware las deja pasar) y **solo GET/HEAD**. Respuestas HTML con `Cache-Control: no-cache` (el navegador revalida; ver D1 en research). Las fotos siguen en `GET /media/works/…` (003, sin cambios).

## `GET /` — catálogo

Parámetros de consulta opcionales:

| Parámetro | Valores | Efecto |
|---|---|---|
| `categoria` | `tortas`, `postres`, `rollos`, `otros` | Filtra por esa categoría. Cualquier otro valor = "Todos" |
| `pagina` | entero 1–8 | Muestra los primeros `24 × pagina` trabajos. Inválido = 1 |

| Caso | Respuesta |
|---|---|
| Con trabajos | **200**. Cabecera (logo, "Samuelé Repostería", "Creamos momentos dulces"); `<nav aria-label="Categorías">` con "Todos", "Tortas", "Postres", "Rollos", "Otros" como enlaces (el activo con `aria-current="page"`); lista de tarjetas (un único `<a href="/trabajos/{id}" aria-label="Ver detalles: {título}">` con foto `sm`, categoría, título y el botón visible **"Ver detalles"**); si hay más, enlace "Ver más trabajos" a `?pagina=N+1` (con el mismo `categoria`); pie |
| Sin trabajos en el catálogo | **200** con el mensaje `empty`, cabecera, categorías y pie |
| Categoría sin trabajos | **200** con el mensaje `emptyCategory` y enlace "Ver todos" |
| Falla D1 | **503** con el mensaje `loadFailed`, enlace "Reintentar" a la misma dirección, cabecera y pie; sin detalles técnicos |

Pie (siempre): sección **CONTACTO** con `WhatsApp: +57 3XX XXX XXXX` (`<a href="https://wa.me/57XXXXXXXXXX?text=…general…">`) y la leyenda **"Cotiza por WhatsApp"**. No hay teléfono aparte, zona de atención, anticipación, precios ni botón flotante.

Cabeceras de la portada (`<head>`): `<title>Samuelé Repostería</title>`; `description` «Creamos momentos dulces. Mira nuestros trabajos y pregunta por WhatsApp.»; `og:title`, `og:description`, `og:type=website`, `og:url`, `og:locale=es_CO`, `og:image=/og-logo.jpg` (absoluta).

## `GET /trabajos/{id}` — detalle

| Caso | Respuesta |
|---|---|
| `id` UUID de un trabajo activo | **200**. Enlace "← Volver" (a `/`, con `history.back()` si se vino del catálogo); foto grande (`md` + `lg` en `srcset`); etiqueta con la categoría; título (`<h1>`); descripción solo si existe (texto plano con saltos de línea); botón **"Preguntar por WhatsApp"** (`<a href="https://wa.me/57XXXXXXXXXX?text=Hola%20Samuelé…">`) (sin leyendas debajo). Sin precios ni pie |
| `id` que no es UUID, no existe o está retirado | **404** con cabecera de marca, "Este trabajo ya no está disponible." y botón "Ver el catálogo". Sin título, foto ni descripción del trabajo; sin etiquetas Open Graph del trabajo |
| Falla D1 | **503** con "No pudimos cargar este trabajo. Intenta de nuevo en un momento.", "Reintentar" y "Ver el catálogo" |

Cabeceras del detalle (`<head>`): `<title>{título} | Samuelé Repostería</title>`; `description` con el inicio de la descripción (≤ 150 caracteres) o «{categoría} de Samuelé Repostería»; `og:title={título}`, `og:description`, `og:type=website`, `og:url`, `og:image` = URL absoluta de la foto `md`.

Mensaje de WhatsApp del detalle: `Hola Samuelé, me interesa el trabajo "{título}". ¿Me puedes dar más información?`, con `{título}` codificado con `encodeURIComponent` (acentos, comillas, emojis y `&` incluidos).

## Contratos sin cambios

- `GET /media/works/{id}-{versión}/{sm|md|lg}.{webp|jpg}` (público, caché inmutable): lo usan la grilla y el detalle.
- `/admin/*` y `/api/admin/*`: sin cambios; siguen protegidos.
- `GET /404`: la página de 004 sigue para cualquier otra dirección.

## Seguridad y privacidad

- Ninguna ruta nueva modifica datos (solo `GET`/`HEAD`; el resto responde 405 por defecto).
- El HTML no incluye `retired_at`, originales, otros identificadores internos ni datos de sesión.
- Título y descripción se escriben como texto (escapado), nunca como HTML.
