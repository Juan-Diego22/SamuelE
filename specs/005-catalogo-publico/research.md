# Investigación: Catálogo público y detalle de trabajo con WhatsApp

No quedan marcadores `NEEDS CLARIFICATION`. Aquí se justifican las decisiones de diseño y los riesgos.

## Decisiones

### D1. Catálogo SSR sin caché propia
- **Decisión**: `/` y `/trabajos/{id}` se renderizan en el Worker en cada visita (`prerender = false`, ya así en `/`), con `Cache-Control: no-cache` para que el navegador revalide.
- **Motivo**: FR-024 a FR-026 piden que publicar, editar y retirar se vea sin desplegar. Prerenderizar exigiría un despliegue por cada cambio. Una caché de borde no está disponible en `workers.dev` sin dominio propio (ADR 0004), así que cachear en el Worker agregaría complejidad sin ahorro real. Sin caché, el reflejo es inmediato (mejor que los 60 s de la spec).
- **Alternativas**: `prerender` + redespliegue desde el panel (descartada: acopla panel y CI); Cache API con TTL de 60 s (descartada por ahora; es la salida si R1 falla).

### D2. Filtro por enlace, no por JavaScript
- **Decisión**: cada chip es un `<a href="/?categoria=tortas">`; "Todos" es `/`. El filtro está en la dirección, así se comparte, se recarga y el botón Atrás funciona (FR-004, FR-014).
- **Slug**: derivado del nombre (minúsculas, sin tildes): `tortas`, `postres`, `rollos`, `otros`. Un valor desconocido o ausente = "Todos" (sin error).
- **Alternativas**: filtrar en cliente (descartada: carga todo el catálogo y exige JavaScript); usar el id numérico en la URL (descartada: poco legible al compartir).

### D3. Paginación acumulativa "Ver más" sin JavaScript
- **Decisión**: página de 24; `?pagina=2` muestra los primeros 48, etc. Se piden `24 × pagina + 1` filas para saber si hay más. Tope de `pagina` = `LIST_LIMIT / 24` (≈ 8 → 192 trabajos, el tope ya existente); más allá se ignora.
- **Motivo**: SC-010 (peso constante) con enlaces simples y sin estado en cliente. Con las decenas de trabajos esperadas casi nunca aparece.
- **Alternativas**: paginación por cursor (descartada: más compleja sin beneficio con esta escala); scroll infinito (descartada: exige JS).

### D4. Detalle en `/trabajos/{id}`
- **Decisión**: dirección estable con el UUID del trabajo; reutiliza `getWork` (ya excluye retirados). Validación `UUID` antes de consultar; no válido o inexistente → 404 con el mismo mensaje (no distingue "retirado" de "nunca existió").
- **Alternativas**: slug por título (descartada: los títulos cambian al editar y rompería enlaces compartidos).

### D5. "← Volver" conserva filtro y posición
- **Decisión**: el enlace apunta al catálogo (`/`), y un script de unas líneas llama a `history.back()` si el visitante vino del propio catálogo (`document.referrer` del mismo origen y ruta `/`). El navegador restaura filtro y posición del scroll. Sin JavaScript o con enlace directo, el enlace lleva a `/` (FR-014).
- **Alternativas**: guardar scroll en `sessionStorage` (descartada: el navegador ya lo hace con `history.back()`); abrir el detalle como modal (descartada: rompe enlaces compartibles).

### D6. Contacto en un módulo de configuración
- **Decisión**: `src/lib/site/contact.ts` exporta `SITE = { name, tagline, whatsapp: "+57 3XX XXX XXXX", messages: { general, work } }`. `whatsapp.ts` normaliza a dígitos (`57XXXXXXXXXX`), valida (8–15 dígitos, E.164) y arma `https://wa.me/{dígitos}?text={encodeURIComponent(texto)}`. Una prueba falla si el número configurado es inválido (FR-021).
- **Frases** (FR-017, FR-018): general «Hola Samuelé, vi su catálogo y quiero más información.»; trabajo «Hola Samuelé, me interesa el trabajo "{título}". ¿Me puedes dar más información?» con el título (o la categoría, si no tiene) sustituido.
- **Motivo**: no es un secreto, así que no va en variables de entorno; versionarlo permite revisarlo en PR. Cambiarlo = una línea y un despliegue (SC-004).
- **Alternativas**: variable de entorno de Cloudflare (descartada: invisible en el repositorio y sin prueba); tabla en D1 editable (descartada: fuera de alcance, HU-05 permite texto fijo).

### D7. Imágenes: `sm` en la grilla, `md`+`lg` en el detalle
- **Decisión**: tarjeta con `<img src=sm width=400 height=400 loading=lazy decoding=async>`; las 4 primeras (primera pantalla) sin `lazy` y la primera con `fetchpriority="high"`. El contenedor es cuadrado (`aspect-ratio: 1`, `object-fit: cover`) como el mockup, de modo que no hay saltos (FR-030). Detalle: `<img src=md srcset="md 900w, lg 1600w" sizes="(min-width: 48rem) 36rem, 100vw">`, la primera sin `lazy`.
- **Foto ausente**: el contenedor lleva el logo de fondo y la imagen se oculta con `onerror`, para no mostrar el ícono de imagen rota (edge case de la spec).
- **Texto alternativo**: «{título} — {categoría}» en la tarjeta y el detalle.

### D8. Vista previa al compartir (HU-04)
- **Decisión**: `BaseLayout` recibe `description`, `image`, `ogType` y emite `<meta name="description">`, `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale="es_CO"`. La URL absoluta se arma con `Astro.url.origin` (no hay `site` configurado).
- **Portada**: `public/og-logo.jpg` (600×600, < 100 KB) estático, sin depender del procesamiento de imágenes en runtime.
- **Detalle**: la foto `md` del propio trabajo (≤ 900 px). Un trabajo retirado responde 404 y no emite estas etiquetas (FR-028).

### D9. Contraste de los colores del mockup
- **Decisión**: el mockup usa `#E85A9A` (rosa) para el chip activo con texto blanco y para la categoría sobre blanco; ambos fallan 4.5:1. Se usa `--rosa-oscuro: #B8326E` (ya definido) en chip activo, etiqueta de categoría, enlace de WhatsApp y botón principal. Tamaños de texto: tarjeta 16 px (mockup 13 px), categoría 14 px en negrita, pie 16 px. Se aplica la regla de `mockups.md` ("contraste mínimo 4.5:1").

### D10. Layout ancho solo para el catálogo
- **Decisión**: `BaseLayout` gana `variant="catalog"` que pone la clase `catalog` en `<main>`: ancho máximo ≈ 60 rem, texto alineado a la izquierda, sin el `max-width: 40 rem` del resto del sitio. Login, panel y 404 no cambian.

### D11. Sin migración ni cambios al panel
- `listWorks(limit, categoryId?)` filtra por la columna ya indexada (`works_category_id_idx`); el orden usa `works_created_at_idx`. La ruta `/media`, el panel y el middleware no cambian (el middleware deja pasar lo público sin consultar D1).

## Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | **CPU de `/` con 24 tarjetas** supera 10 ms (plan gratuito). El ADR 0002 dejó "reevaluar al llegar al catálogo". | HTML simple sin JavaScript de cliente; 2 consultas D1; se mide en producción con 24 trabajos como en 003/004 (quickstart §6). Si falla: Cache API con TTL corto, bajar la página a 12 o Workers Paid (ADR 0002). |
| R2 | **Solicitudes al Worker**: cada foto de `/media` cuenta en el límite de 100.000/día; una visita inicial con 24 fotos ≈ 25 solicitudes → ≈ 4.000 visitas/día. | Se espera una fracción; `loading="lazy"` evita pedir las de fuera de pantalla; las fotos se cachean un año en el navegador (visitas repetidas = 0). Se documenta en ADR 0009; la salida es Workers Paid o dominio propio con caché de borde. |
| R3 | **Vista previa**: WhatsApp e Instagram pueden no mostrar `webp` en `og:image`, o tardar en refrescar vistas guardadas. | Portada en JPG; en el detalle se prueba con una foto `webp` y `jpg` en celular real. Si falla con `webp`, se sirve el detalle con `md` solo si la extensión es `jpg`, y de lo contrario se usa el logo (decisión en quickstart §5). |
| R4 | **Retiro y ráfagas de pantalla**: quien tiene el catálogo abierto verá un trabajo ya retirado hasta recargar; al tocarlo, 404 amable. | Es el comportamiento esperado (FR-015); `no-cache` evita que el navegador sirva copias viejas al volver. |
| R5 | **Foto cuadrada recorta** fotos verticales u horizontales (`object-fit: cover`). | El mockup define cuadrados. La administradora ve el recorte al revisar en celular; si molesta, se pasa a `contain` o relación 4:5 sin cambiar la lógica. |
