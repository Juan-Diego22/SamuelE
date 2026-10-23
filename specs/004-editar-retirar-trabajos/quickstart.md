# Guía de validación: Editar y retirar los trabajos del panel

Guía para comprobar que la funcionalidad funciona de punta a punta. Rutas y campos: [contracts/http-routes.md](contracts/http-routes.md). Tablas, estados y mensajes: [data-model.md](data-model.md).

## Requisitos previos

- Node 22 y dependencias instaladas (`npm ci`).
- `.dev.vars` con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (ver `.dev.vars.example`, funcionalidad 002).
- Entorno local sin cuenta de Cloudflare: D1 y R2 se simulan.
- Un celular real con fotos de prueba: una normal, una con ubicación activada y una tomada en vertical, y una segunda foto distinta para reemplazar la primera.
- Para producción: bucket `samuele-media` y migraciones aplicadas (el despliegue aplica `0002`).

## 1. Pruebas automatizadas

```sh
npm run lint
npm run check
npm run format:check
npm test
```

Resultado esperado: todo en verde, incluidas `tests/works/update.test.ts`, `retire.test.ts`, `update-api.test.ts`, `retire-api.test.ts` y `edit-page.test.ts`.

## 2. Base de datos local

```sh
npx wrangler d1 migrations apply samuele-reposteria --local
npx wrangler d1 execute samuele-reposteria --local --command "PRAGMA table_info(works)"
```

Esperado: aparece la columna `retired_at` (entero, nula) y las filas existentes siguen activas.

## 3. Formulario: zona de foto y textos de ayuda (historia 3)

```sh
npm run dev
```

1. Abrir `/admin/works/new`. Comparar con el mockup "Panel: Nuevo": recuadro punteado dorado, cámara grande, "Toca para subir foto" y debajo, más pequeño, "Galería o cámara".
2. Comprobar el selector ("Selecciona una categoría" primero, luego Tortas, Postres, Rollos, Otros), los placeholders y los asteriscos rojos en Foto, Categoría y Título; "(opcional)" en Descripción.
3. Tocar cualquier punto del recuadro: se abre el selector de foto. Elegir una: se ve la vista previa y se puede volver a tocar para cambiarla.
4. Con teclado: Tab llega al recuadro con anillo de foco visible; Enter/Espacio abre el selector.
5. Con lector de pantalla: la cámara no se anuncia; "Foto (obligatorio)", "Categoría (obligatorio)", "Título (obligatorio)" y "Descripción (opcional)".
6. Pulsar "Publicar" con el título vacío o con espacios: "Escribe un título." junto al campo, sin perder lo demás. Con foto o categoría vacías, sus mensajes de 003.

## 4. Editar (historia 2)

1. Publicar dos trabajos de prueba. En la lista, cada tarjeta muestra "Editar" y "Retirar".
2. Pulsar "Editar": título de pantalla "Editar trabajo", foto actual en la vista previa, categoría, título y descripción precargados, botón "Guardar".
3. Cambiar solo el título y guardar: vuelve a la lista con "Trabajo actualizado."; el título cambió, la foto y el lugar en la lista no. En las herramientas de red del navegador: el `PUT` no envía archivos.
4. Editar otro: cambiar categoría y **borrar la descripción**; guarda sin problema. Después borrar el título: "Escribe un título." y no guarda.
5. Reemplazar la foto con una con ubicación GPS: vista previa nueva; al guardar, la lista muestra la nueva (URL con `-2` en la ruta). Descargar `sm`, `md` y `lg` de `/media/works/<id>-2/…` y comprobar sin metadatos:

```sh
exiftool <archivo>      # sin GPS ni EXIF
identify <archivo>      # anchos 400, 900 y 1600
```

6. `/media/works/<id>-1/sm.webp` (o `.jpg`) ya responde 404; el original antiguo no existe en `.wrangler/state/v3/r2/`.
7. Elegir un PDF o un `.txt` renombrado como foto en la edición: se rechaza con el mensaje de formato y la foto actual y lo escrito se conservan.
8. Pulsar "Guardar" dos veces rápido con foto nueva: queda una sola versión nueva.
9. Con dos pestañas del mismo trabajo, reemplazar la foto en la primera y luego en la segunda: la segunda recibe "Este trabajo cambió. Recarga la página…".
10. Apagar la red y guardar: mensaje sencillo, campos conservados, reintento posible; el trabajo conserva sus datos anteriores.

## 5. Retirar (historia 1)

1. En la lista, pulsar "Retirar" en un trabajo: aparece el diálogo "¿Retirar este trabajo?" con "Dejará de verse en el catálogo público.", "Cancelar" y "Retirar" (rojo); lo de atrás queda inactivo.
2. Teclado y lector: el foco entra al diálogo y no sale con Tab; Escape lo cierra y el foco vuelve al botón "Retirar" que lo abrió; el título se anuncia.
3. "Cancelar": el trabajo sigue.
4. "Retirar": vuelve a la lista con "Trabajo retirado." y el trabajo ya no está; recargar y volver a iniciar sesión no lo trae de vuelta. Retirar el último muestra el mensaje de lista vacía.
5. En D1 el registro sigue con `retired_at`:

```sh
npx wrangler d1 execute samuele-reposteria --local --command "SELECT id, title, retired_at FROM works"
```

6. Abrir `/admin/works/<id-retirado>/edit`: 404 con "Ese trabajo ya no está disponible." y botón "Volver a Mis trabajos".
7. Apagar la red y pulsar "Retirar" en el diálogo: mensaje dentro del diálogo, sigue abierto, el trabajo sigue en la lista; al reconectar, se puede reintentar.
8. Sin sesión: `POST /api/admin/works/<id>/retire` y `PUT /api/admin/works/<id>` responden 401; con `Origin` ajeno, 403.

## 6. Prueba en celular real (principio II, SC-001, SC-004, SC-008, SC-009)

Con el sitio desplegado o con `npm run dev -- --host` desde la misma red:

1. Iniciar sesión desde el celular y comprobar la lista (tarjetas con "Editar" y "Retirar", sin solaparse con títulos largos) y el diálogo contra la referencia `docs/design/5 · Panel lista + confirmar.png`.
2. Medir: retirar un trabajo en menos de 10 s (SC-001); corregir título o categoría en menos de 30 s y reemplazar la foto en menos de 1 minuto (SC-004).
3. Comparar la zona de foto, los placeholders y los asteriscos lado a lado con el mockup "Panel: Nuevo" (SC-009). Tocar el borde y las esquinas del recuadro.
4. Reemplazar una foto con la cámara en vertical y con una con ubicación: derecha y sin GPS (sección 4).
5. Pedir a la administradora real que busque y use "Editar" y "Retirar" sin explicarle nada (SC-008).

## 7. Rendimiento y accesibilidad (SC-010)

- Lighthouse móvil sobre `/admin` (con tarjetas y el diálogo cerrado) y `/admin/works/new`, `/admin/works/<id>/edit` (con sesión): rendimiento y accesibilidad ≥ 90.
- Verificar con una herramienta de contraste: placeholders, asterisco rojo y botón "Retirar" ≥ 4,5:1.
- Navegar todo el flujo solo con teclado.

## 8. CPU en producción (riesgo R1)

Tras desplegar: editar un trabajo solo el título, editarlo con foto nueva y retirar otro; revisar en Cloudflare (Workers → Observabilidad) el tiempo de CPU de `PUT /api/admin/works/{id}` (con y sin foto) y de `POST …/retire`. Esperado: ≤ 10 ms. Si el `PUT` con foto lo excede, aplicar la mitigación de [003 research D2](../003-panel-nuevo-trabajo/research.md) y documentarlo.
