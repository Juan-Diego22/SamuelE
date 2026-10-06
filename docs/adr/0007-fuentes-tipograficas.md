# ADR 0007: Fuentes tipográficas

- **Estado**: aceptada
- **Fecha**: 2026-10-06

## Contexto

El branding de los mockups (`docs/design/mockups.md`) usa `Dancing Script` para títulos y el nombre del negocio, y la fuente sans del sistema para el resto. En el mockup la fuente script no se carga de ningún proveedor, así que cada dispositivo muestra una cursiva distinta. Hay que definir cómo se sirve sin costo y sin perjudicar el rendimiento (principio II) ni la privacidad (principio III).

## Decisión

- **Dancing Script autoalojada**: se instala con el paquete `@fontsource/dancing-script` y se sirve como static asset del Worker (gratis y sin límite, ADR 0002). Solo en WOFF2, subconjunto latino (cubre tildes y ñ), y solo los pesos que se usen.
- **`font-display: swap`**: el texto se ve de inmediato con la fuente de respaldo y cambia al cargar.
- **Texto general**: pila de fuentes del sistema (`system-ui`, `Segoe UI`, `Roboto`, `sans-serif`), sin descargas.
- **Uso acotado**: la script solo en títulos y en el nombre del negocio, nunca en párrafos ni formularios, por legibilidad.

## Consecuencias

- No hay peticiones a Google Fonts ni a otros terceros, así que el visitante no queda expuesto a un rastreo de terceros.
- Se descarga un solo archivo pequeño, cacheable por el navegador.
- Licencia SIL Open Font License: permite autoalojarla y usarla comercialmente.

## Alternativas consideradas

1. **Google Fonts por CDN**: es simple, pero hace una petición a un tercero en cada visita y no aporta nada frente a servirla desde el mismo sitio.
2. **Solo fuentes del sistema**: se pierde la identidad visual del logo.

## Referencias

- Constitución: principios I, II y III.
- `docs/design/mockups.md`, sección Pendiente.
- ADR 0002.
