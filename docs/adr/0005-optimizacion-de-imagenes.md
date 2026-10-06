# ADR 0005: Optimización de imágenes

- **Estado**: aceptada
- **Fecha**: 2026-10-05
- **Revisión**: 2026-10-06. Se agrega JPEG como respaldo de WebP porque Safari no codifica WebP desde canvas. Se quitan `heic2any` y `exifr`, que no hacen falta.

## Contexto

HU-08 pide que la administradora suba su foto ya editada y que el sistema:

- valide tipo y tamaño;
- corrija la orientación;
- genere varios tamaños en un formato eficiente;
- elimine los metadatos, sobre todo la ubicación.

El principio III exige lo mismo, con validación en el servidor.

En el Worker no corren `sharp` ni Pillow, y el límite de 10 ms de CPU (ADR 0002) impide procesar imágenes ahí. La transformación administrada de Cloudflare Images requiere dominio propio o plan de pago para este uso.

## Decisión

El procesamiento se hace **en el navegador de la administradora**. El servidor **valida y guarda**.

1. **Selección**: `<input type="file" accept="image/jpeg,image/png,image/webp">`, con opción de cámara. Al no listar HEIC, iOS [convierte automáticamente](https://developer.apple.com/forums/thread/727526) las fotos HEIC a JPEG al elegirlas.
2. **Decodificación**: `createImageBitmap(file)`, que aplica la orientación EXIF.
3. **Derivadas**: se dibuja en canvas en 3 anchos (de referencia: 400, 900 y 1600 px).
4. **Codificación**: se intenta WebP. Si el navegador devuelve otro tipo, como en [Safari](https://caniuse.com/mdn-api_htmlcanvaselement_toblob_type_parameter_webp), se usa JPEG con calidad cercana a 0,8. Re-codificar en canvas elimina todo el EXIF, GPS incluido.
5. **Original**: se sube el archivo tal cual, a la ruta privada de R2 (ADR 0004).
6. **Servidor**: verifica sesión, tamaño (original ≤ 15 MB, derivadas ≤ 1 MB), tipo por bytes mágicos (no por extensión) y que estén las tres derivadas. Luego escribe en R2 y en D1.

## Consecuencias

- La subida se aliviana: la administradora sube la original más unos cientos de KB, y la conversión cuesta segundos en su celular.
- En iPhone las derivadas serán JPEG y no WebP, y pesarán algo más. Sigue cumpliendo la meta de cientos de KB por imagen de la grilla.
- La calidad y el tiempo dependen del celular de la administradora. **Se prueba en su celular real** (principio II, definición de terminado).
- Pruebas automatizadas: la elección de tamaños y formato y la validación en el servidor son lógica pura, testeable sin navegador. Un caso de prueba verifica que una foto con GPS no conserva metadatos en las derivadas.
- Si se agrega edición automática en el futuro, se aplica sobre la original guardada.

## Alternativas consideradas

1. **Procesar en el servidor**: no cabe en 10 ms de CPU, y las librerías habituales no corren en Workers.
2. **Cloudflare Images (transformaciones)**: 5.000 transformaciones únicas al mes gratis, pero requiere dominio propio para transformar por URL. Se reevalúa si se compra dominio.
3. **Codificador WebP en WASM (por ejemplo, jSquash)**: daría WebP también en Safari. Se descarta por ahora para no sumar dependencias; queda como mejora si el peso de los JPEG resulta un problema.
4. **Solo validar, sin optimizar**: no cumple HU-08.

## Referencias

- Constitución: principios II, III y V.
- PRD Fase 1: HU-07, HU-08, HU-09.
- ADR 0002, ADR 0004.
