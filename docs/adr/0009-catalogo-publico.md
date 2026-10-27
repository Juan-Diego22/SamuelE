# ADR 0009: Catálogo público, contacto y frescura

- **Estado**: aceptada
- **Fecha**: 2026-10-27

## Contexto

La funcionalidad 005 publica los trabajos del panel como catálogo y detalle para el enlace que se comparte con los clientes (HU-01 a HU-05). Hay que decidir cómo se renderiza, cómo se filtra, dónde viven los datos de contacto y qué se recorta del mockup. Las razones detalladas están en `specs/005-catalogo-publico/research.md`.

## Decisión

- **Renderizado**: el catálogo (`/`) y el detalle (`/trabajos/{id}`) se renderizan en el Worker en cada visita (SSR) leyendo D1, con `Cache-Control: no-cache`. Lo que la administradora publica, edita o retira se ve en la siguiente visita, sin desplegar. Prerenderizar exigiría un despliegue por cada cambio; la caché de borde no está disponible en `workers.dev` (ADR 0004).
- **Filtro y paginación por enlaces**: `/?categoria=tortas` y `?pagina=N` (24 trabajos por página, "Ver más" acumulativo, tope de 8 páginas). Sin JavaScript de cliente y compartibles. El detalle usa el UUID del trabajo, estable aunque cambie el título.
- **Contacto en configuración versionada**: el número de WhatsApp y las frases prellenadas viven en `src/lib/site/contact.ts`. No son secretos y así se revisan en PR y se prueban. Cambiar el número es editar una línea y desplegar. Durante las pruebas se usó el número del desarrollador; desde el 2026-10-28 es el de la administradora.
- **Recortes respecto al mockup** (decisión del negocio): sin botón flotante de WhatsApp y con un pie reducido al WhatsApp y la leyenda "Cotiza por WhatsApp" (sin teléfono aparte, zona de atención ni anticipación). Se pueden volver a añadir en la misma configuración.
- **Colores**: el texto sobre blanco y el chip activo usan el rosa oscuro `#B8326E`; el rosa `#E85A9A` del mockup no llega a 4.5:1.
- **Vista previa al compartir**: etiquetas Open Graph; la portada usa `public/og-logo.jpg` y cada detalle la foto `md` del trabajo.

## Consecuencias

- **Solicitudes**: cada foto de `/media` cuenta en el límite de 100.000 solicitudes/día del Worker (ADR 0002). Una visita inicial con 24 fotos son unas 25 solicitudes (≈ 4.000 visitas/día); las fotos fuera de pantalla cargan al desplazarse y se cachean un año en el navegador. Salida: Workers Paid o dominio propio con caché de borde.
- **CPU**: el SSR con 24 tarjetas debe caber en los 10 ms del plan gratuito; se mide en producción (resultado en `specs/005-catalogo-publico/tasks.md` y en la nota del ADR 0002). Si falla: Cache API con TTL corto o páginas de 12.
- Una foto cuadrada recorta fotos verticales u horizontales (como en el mockup); si molesta se cambia a otra relación sin tocar la lógica.

## Alternativas consideradas

1. **Prerender + redespliegue desde el panel**: descartada, acopla el panel con el CI.
2. **Cache API con TTL de 60 s**: reservada como salida si el CPU no alcanza.
3. **Número en variable de entorno o tabla de D1 editable**: descartadas; la primera es invisible en el repositorio y la segunda queda fuera de alcance (HU-05 admite texto fijo).
4. **Filtro en el cliente**: descartada, carga todo el catálogo y exige JavaScript.

## Referencias

- Constitución: principios I, II y IV.
- PRD Fase 1: HU-01 a HU-05, HU-13, HU-15.
- ADR 0002, ADR 0004.
