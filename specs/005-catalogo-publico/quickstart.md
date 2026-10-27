# Guía de validación: Catálogo público y detalle con WhatsApp

Rutas y cabeceras: [contracts/http-routes.md](contracts/http-routes.md). Vistas y configuración de contacto: [data-model.md](data-model.md). Riesgos: [research.md](research.md).

## Requisitos previos

- Node 22 y dependencias instaladas (`npm ci`); `.dev.vars` como en 002.
- D1 y R2 locales simulados (`npm run dev`). No se necesita migración (esta funcionalidad no cambia el esquema).
- Un celular real con WhatsApp instalado y datos celulares; fotos de prueba (una vertical, una horizontal, una `webp`).
- Para producción: el despliegue de `main` y al menos 8 trabajos en varias categorías (idealmente 24 para medir CPU).

## 1. Pruebas automatizadas

```sh
npm run lint
npm run check
npm run format:check
npm test
```

Esperado: todo en verde, incluidas `tests/catalog/*.test.ts` y el nuevo `tests/home.test.ts`.

## 2. Catálogo con datos (historia 1)

```sh
npm run dev
```

1. Con la base vacía, abrir `/`: mensaje de catálogo en preparación, cabecera, categorías y pie.
2. Desde `/admin`, publicar 3 trabajos en 2 categorías (uno sin título). Abrir `/` **sin sesión** (ventana privada): aparecen, el más reciente primero, con foto, título (o categoría) y categoría.
3. Tocar "Tortas": solo las tortas, chip activo distinto, dirección `/?categoria=tortas`. Tocar "Rollos" (sin trabajos): mensaje y "Ver todos". `/?categoria=xyz` muestra todos.
4. Reducir el navegador a 320 px: dos columnas, sin desplazamiento horizontal de la página; deslizar solo la fila de categorías. En ≥ 768 px: tres columnas centradas.

## 3. Detalle y WhatsApp (historias 2 y 3)

1. Cada tarjeta muestra su botón "Ver detalles". Tocarla (en cualquier punto, también el botón): foto grande, etiqueta, título, descripción (probar una con saltos de línea y con `<b>negrita</b>`: se ve literal).
2. Un trabajo sin descripción: no hay hueco vacío.
3. "Preguntar por WhatsApp" abre `https://wa.me/573165441337?text=…`; en el celular abre WhatsApp con «Hola Samuelé, me interesa el trabajo "…". ¿Me puedes dar más información?» sin escribir nada. Probar títulos con acentos, comillas y `&`.
4. En el pie del catálogo: "WhatsApp: +57 316 544 1337" abre la conversación con el mensaje general; solo hay WhatsApp y la leyenda (sin teléfono, zona, anticipación ni botón flotante).
5. "← Volver" tras filtrar y bajar en la lista: regresa al mismo filtro y a la misma posición. Abrir un detalle por enlace directo (pegado en otra pestaña) y pulsar "← Volver": va a `/`.
6. Cambiar `whatsapp` en `src/lib/site/contact.ts`: el pie y el detalle usan el nuevo número tras recargar (volver al valor de prueba).

## 4. Refleja los cambios del panel (historia 4)

Con el catálogo abierto en una pestaña y el panel en otra:

1. Publicar un trabajo → recargar el catálogo: aparece primero.
2. Editar título, categoría y descripción → recargar: datos nuevos, y el trabajo bajo su nueva categoría.
3. Reemplazar la foto → recargar (sin limpiar caché): foto nueva, nunca la anterior.
4. Retirar → recargar: desaparece; abrir su `/trabajos/{id}` anterior: 404 "Este trabajo ya no está disponible." sin título ni foto.
5. Tocar la tarjeta de un trabajo retirado desde una pestaña vieja: misma página 404.

## 5. Vista previa al compartir (historia 5)

1. Pegar el enlace principal en un chat de WhatsApp: título "Samuelé Repostería", descripción e imagen del logo.
2. Pegar el enlace de un detalle (con foto `webp` y con foto `jpg`): título del trabajo y su foto. Si WhatsApp o Instagram no muestran la foto `webp`, aplicar la mitigación de R3 (logo como respaldo) y anotarlo.
3. Pegar el enlace de un trabajo retirado: sin foto ni título del trabajo.
4. WhatsApp e Instagram guardan vistas previas; si una no cambia, esperar o usar un enlace con parámetro distinto (`?v=2`).

## 6. Errores y estados (historia 6)

- Fallo de D1: las pruebas automatizadas lo simulan; en local, detener o renombrar la base y comprobar el mensaje sin detalles técnicos con "Reintentar".
- Conexión lenta (herramientas del navegador, "Slow 3G"): cada foto tiene su espacio reservado y el contenido no se mueve; apagar una foto (borrar su clave en R2 local) muestra el logo en lugar del ícono de imagen rota.

## 7. Cierre en producción

Se registra en `tasks.md` como en 003 y 004.

1. **Lighthouse móvil** (`/` con trabajos reales y un `/trabajos/{id}`): rendimiento, accesibilidad y buenas prácticas ≥ 90 (SC-008). `lighthouserc.json` audita `/` en CI con la base vacía; la medición con datos es manual.
2. **CPU del Worker** con 24 trabajos (R1): Cloudflare → Workers → Observabilidad / métricas: P50 y P99 de CPU de `/`, `/trabajos/{id}` y `/media/…` ≤ 10 ms. Anotar el resultado y actualizar la nota de ADR 0002.
3. **Solicitudes por visita** (R2): abrir `/` en una pestaña nueva con caché vacía y contar solicitudes en la pestaña Red (esperado ≈ 1 página + fotos de la primera pantalla; las demás cargan al desplazarse).
4. **Celular real**: flujo completo cliente (abrir enlace → filtrar → detalle → WhatsApp) y revisión visual lado a lado con los mockups "Catálogo", "Detalle" y "Responsivo".
5. **Cambio de número**: cuando la administradora entregue el suyo, editar `contact.ts`, desplegar y repetir §3.3 y §3.4.
