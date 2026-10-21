# Guía de validación: Panel de trabajos y creación de trabajos

Guía para comprobar que la funcionalidad funciona de punta a punta. Rutas y campos: [contracts/http-routes.md](contracts/http-routes.md). Tablas y límites: [data-model.md](data-model.md).

## Requisitos previos

- Node 22 y dependencias instaladas (`npm ci`).
- `.dev.vars` con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (ver `.dev.vars.example`, funcionalidad 002).
- Para el entorno local no hace falta cuenta de Cloudflare: D1 y R2 se simulan.
- Para producción: bucket `samuele-media` creado, R2 activado con medio de pago y alerta de facturación (ADR 0004).
- Un celular real con fotos de prueba: una normal, una tomada con la cámara con ubicación activada y una tomada en vertical.

## 1. Pruebas automatizadas

```sh
npm run lint
npm run check
npm run format:check
npm test
```

Resultado esperado: todo en verde, incluidas las pruebas de `tests/works/`.

## 2. Base de datos local

```sh
npx wrangler d1 migrations apply samuele-reposteria --local
npx wrangler d1 execute samuele-reposteria --local --command "SELECT id, name FROM categories ORDER BY position"
```

Esperado: cuatro filas (Tortas, Postres, Rollos, Otros).

## 3. Recorrido manual en el navegador

```sh
npm run dev
```

1. Abrir `/admin` sin sesión: redirige a `/admin/login`. Abrir `/admin/works/new` y `POST /api/admin/works` sin sesión: redirige / responde 401.
2. Entrar. `/admin` muestra "Mis trabajos" con el mensaje de lista vacía y "+ Nuevo trabajo".
3. Pulsar "+ Nuevo trabajo", pulsar "Publicar" sin nada: mensaje claro de foto faltante. Elegir foto sin categoría: mensaje de categoría faltante.
4. Elegir un PDF o un `.txt` renombrado a `.jpg`: se rechaza con "formato no admitido" y el resto del formulario se conserva.
5. Elegir una foto válida y una categoría; publicar sin título ni descripción: vuelve a `/admin` con "Trabajo publicado" y la tarjeta usa la categoría como título.
6. Publicar otro con título y descripción: aparece primero en la lista. Un título con `<script>alert(1)</script>` se ve como texto.
7. Pulsar "Publicar" dos veces rápido: se crea un solo trabajo.

## 4. Verificación de la foto (HU-08)

Con el trabajo del paso 3.5 creado, comprobar las derivadas guardadas en R2 local (directorio `.wrangler/state/v3/r2/`) o descargándolas desde `/media/works/<id>-1/{sm,md,lg}.webp` (o `.jpg` en Safari):

```sh
# Ubicación y metadatos: no debe salir GPS ni EXIF en las derivadas
exiftool <archivo>
# Dimensiones y peso: anchos de 400, 900 y 1600 px; md de unos cientos de KB como máximo
identify <archivo>
```

Esperado: sin metadatos de ubicación en `sm`, `md` y `lg`; la foto tomada en vertical se ve derecha; la miniatura pesa mucho menos que la grande.

## 5. Prueba en celular real (principio II, SC-001, SC-008)

Con el sitio desplegado o con `npm run dev -- --host` desde la misma red:

1. Iniciar sesión desde el celular. Comprobar que la lista y el formulario se ven como los mockups 4 y 5.
2. En "Foto", comprobar que se puede elegir de la galería **y** tomarla con la cámara.
3. Publicar un trabajo completo y **medir el tiempo**: menos de 1 minuto (SC-001).
4. Repetir con la cámara en modo vertical y con una foto con ubicación: sin GPS y derecha en el resultado (pasos de la sección 4).
5. En iPhone, elegir una foto HEIC: debe funcionar (iOS la convierte a JPEG). Anotar el formato real que produce el celular de la administradora (pregunta abierta del PRD).
6. Apagar los datos y pulsar "Publicar": mensaje sencillo, campos conservados, y al reconectar se puede reintentar.

## 6. Rendimiento y accesibilidad

- Lighthouse móvil sobre `/admin` y `/admin/works/new` (con sesión): rendimiento y accesibilidad ≥90 (SC-007).
- Navegar el formulario solo con teclado; los errores se anuncian con un lector de pantalla.

## 7. CPU en producción (riesgo R1)

Tras desplegar, publicar un trabajo y revisar en el panel de Cloudflare (Workers → Observabilidad) el tiempo de CPU de `POST /api/admin/works`. Esperado: ≤10 ms. Si lo excede, se aplica la mitigación de [research.md](research.md) D2 (una petición `PUT` por archivo) y se documenta.
