# Investigación: Panel de trabajos y creación de trabajos

Las decisiones grandes ya están en los ADR 0003, 0004 y 0005. Aquí se resuelven los detalles que la spec dejó abiertos. No quedan `NEEDS CLARIFICATION`.

## D1. HEIC: se corrige la spec

- **Decisión**: el selector declara `accept="image/jpeg,image/png,image/webp"` y no lista HEIC. El servidor rechaza HEIC/HEIF por bytes con el mensaje "Esa foto no tiene un formato admitido. Usa JPEG, PNG o WebP."
- **Motivo**: la spec suponía aceptar HEIC. El ADR 0005 ya decidió lo contrario: al no listarlo, iOS convierte automáticamente a JPEG las fotos HEIC al elegirlas, y Android produce JPEG. Aceptar HEIC exigiría un decodificador en WASM que el ADR descartó. La pregunta abierta del PRD (formato real del celular de la administradora) se cierra en la prueba con su celular.
- **Alternativas**: decodificador HEIC en WASM (`heic2any`): descartado en el ADR 0005 por peso y dependencia.
- **Efecto**: se ajustan FR-010 y el supuesto de HEIC en la spec.

## D2. Un solo envío `multipart` con la original y las tres derivadas

- **Decisión**: `POST /api/admin/works` recibe `multipart/form-data` con `id`, `category`, `title`, `description`, `original`, `sm`, `md` y `lg`. El navegador genera `id` (`crypto.randomUUID()`) antes de enviar.
- **Motivo**: un único paso simplifica los estados de error y la atomicidad (FR-014). El `id` generado en el cliente hace idempotente el reintento y el doble toque (FR-016): el segundo insert con la misma clave se trata como éxito.
- **Alternativas**: subir cada archivo con una petición propia y confirmar al final (más estados intermedios y huérfanos); URL firmada a R2 (requiere claves S3 como secreto y CORS; más superficie).
- **Riesgo R1 (CPU)**: leer `request.formData()` de unos 3 a 5 MB puede acercarse a los 10 ms de CPU del plan gratuito. Mitigación: se mide en local y tras desplegar (como T030 de 002). Si excede, se cambia a una petición `PUT` por archivo que escribe `request.body` directo en R2 sin analizarlo. El contrato de la spec no cambia.

## D3. Límites

- **Decisión**: original ≤15 MB; cada derivada ≤1 MB (valores del ADR 0005). Título ≤80 caracteres y descripción ≤1000, contados tras recortar espacios. Anchos de salida 400, 900 y 1600 px; calidad ~0,8; nunca se agranda una foto menor al ancho (la derivada conserva el ancho original).
- **Motivo**: el ADR ya fija los de foto. Los largos de texto son un valor razonable para una tarjeta y un detalle móvil. Se concentran en `limits.ts` para ajustarlos en un solo lugar.

## D4. Tipo por bytes y verificación de metadatos en el servidor

- **Decisión**: `media.ts` identifica JPEG (`FF D8 FF`), PNG (`89 50 4E 47`) y WebP (`RIFF....WEBP`) por los primeros bytes. La original puede ser cualquiera de los tres; las derivadas solo WebP o JPEG. Además, el servidor revisa que cada derivada **no contenga** segmentos de metadatos: en JPEG, marcadores APP1 (`FF E1`, EXIF/XMP) y APP13; en WebP, bloques `EXIF` y `XMP `. Se recorre solo la estructura de cabecera, no los píxeles.
- **Motivo**: el ADR 0005 confía en que el canvas elimine el EXIF, pero el servidor no debe confiar en el cliente (principio III: validar todo archivo subido). La revisión es de unos cientos de bytes y cabe en el presupuesto de CPU. Un navegador que no elimine metadatos haría que la subida falle de forma visible en vez de publicar la ubicación.
- **Alternativas**: confiar solo en el cliente (rechazada por el principio III); re-codificar en el servidor (no cabe en 10 ms).
- **Nota**: la original conserva su EXIF pero es privada y no tiene endpoint (ADR 0004). FR-013 aplica a lo publicado.

## D5. Atomicidad con R2 y D1 (FR-014)

- **Decisión**: orden de escritura: R2 (original, sm, md, lg) y luego D1 (`works`). Si falla cualquier escritura de R2, se borran las ya escritas. Si falla D1 con un error distinto de clave duplicada, se borran las cuatro de R2. Si la limpieza también falla, quedan archivos sin trabajo (invisibles, sin ruta pública salvo conocer la clave); se registra en el log del Worker.
- **Motivo**: ni D1 ni R2 ofrecen transacciones entre sí. Escribir D1 al final garantiza que nunca haya un trabajo visible sin fotos. El ADR 0004 ya acepta que el borrado físico no es parte de la Fase 1.
- **Clave duplicada (D1)**: significa reintento del mismo `id`; se responde éxito sin tocar R2 (las claves son inmutables y contienen el mismo contenido).

## D6. Versión de la foto y extensión

- **Decisión**: el trabajo guarda `photo_version` (siempre 1 aquí) y `photo_ext` (`webp` o `jpg`), igual para las tres derivadas porque salen del mismo navegador y codificador. Claves según ADR 0004: `originals/{id}-{version}.jpg`, `works/{id}-{version}/{sm|md|lg}.{ext}`.
- **Motivo**: `photo_version` deja listo el reemplazo de foto (HU-09, Hito 5) sin migrar. La original se guarda con extensión `.jpg` por convención del ADR aunque sea PNG o WebP; su tipo real no se sirve nunca.

## D7. Ruta de medios

- **Decisión**: `GET /media/works/{id}-{version}/{sm|md|lg}.{webp|jpg}` lee de R2 y responde con el `Content-Type` correspondiente y `Cache-Control: public, max-age=31536000, immutable`. Cualquier otra ruta, incluida `originals/`, responde 404. Se valida la forma de la ruta con una expresión estricta antes de tocar R2.
- **Motivo**: ADR 0004 (`r2.dev` es solo de desarrollo). La ruta es pública porque el catálogo (Hito 4) la reutilizará; hoy la usa la lista del panel.
- **Efecto en costo**: cada miniatura es una petición del Worker (ADR 0004 ya lo asume); la caché del navegador evita repetirlas.

## D8. Categorías fijas

- **Decisión**: tabla `categories` con 4 filas insertadas por la propia migración (Tortas, Postres, Rollos, Otros), `id` 1 a 4, `position` para el orden. El formulario las lee de D1; el servidor rechaza un `category` que no exista.
- **Motivo**: ADR 0003 prevé la tabla; HU-11 (gestionarlas) añadirá pantallas sin cambiar el esquema. Insertarlas en la migración evita un paso manual y las deja versionadas.

## D9. Cliente: formulario y optimización

- **Decisión**: formulario HTML normal con `<input type="file" accept="image/jpeg,image/png,image/webp">`. En un celular, ese `accept` ofrece galería y cámara sin atributo extra (no se usa `capture`, que fuerza la cámara). Un script de Astro: muestra la vista previa con `URL.createObjectURL`, valida los campos antes de enviar, llama a `optimize.ts` (decodifica con `createImageBitmap(file, { imageOrientation: "from-image" })`, dibuja en canvas, `toBlob` en WebP y, si el navegador devuelve otro tipo, JPEG), arma el `FormData` y lo envía con `fetch`. Al recibir 201 redirige a `/admin?publicado=1`; ante error muestra el mensaje del servidor junto al campo, conserva el estado y reactiva el botón.
- **Estado de espera**: el botón queda desactivado con el texto "Publicando…" y `aria-busy`; el mismo `id` evita duplicados aunque se fuerce un segundo envío.
- **Sin JavaScript**: `<noscript>` explica que el formulario necesita JavaScript.
- **Riesgo R2**: el tiempo y la calidad de la optimización dependen del celular de la administradora; se prueba en su celular real (principio II).

## D10. Lista del panel

- **Decisión**: una consulta con unión `works` + `categories`, ordenada por `created_at` descendente y limitada a 200 filas (una sola consulta D1). Si no hay título, la tarjeta muestra la categoría como título (FR-002). El aviso "Trabajo publicado" aparece con `?publicado=1`. Los botones "Editar" y "Retirar" no se muestran hasta el Hito 5.
- **Motivo**: simple y barata en filas leídas (ADR 0003). El tope de 200 es suficiente para el inicio ("cantidad aproximada de trabajos" sigue como pregunta abierta del PRD); si se acerca, la paginación se planifica con el catálogo (Hito 4).

## D11. Prerrequisitos de entorno

- **Decisión**: se añade `r2_buckets` con binding `MEDIA` y bucket `samuele-media` a `wrangler.jsonc`. En desarrollo local, `wrangler`/`astro dev` simulan R2 sin cuenta ni tarjeta. Para producción hay que crear el bucket y activar R2 (medio de pago registrado, con alerta de facturación, según ADR 0004). Se documenta en el README.
- **Motivo**: sin el bucket, el despliegue falla. Es acción de la dueña de la cuenta, no del código.
