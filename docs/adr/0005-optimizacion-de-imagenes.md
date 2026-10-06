# ADR 0005: Optimización de Imágenes

**Status**: Accepted

**Date**: 2026-10-05

## Context

HU-08 requiere:
- Validación y corrección de orientación.
- Generación de múltiples tamaños (thumb, medium, large).
- Conversión a WebP.
- Eliminación de metadatos (EXIF, GPS).
- Soporte para HEIC (si usa iPhone).
- Límite de tamaño razonable (ej. 10MB).

Sharp (librería estándar) no corre en Workers. Procesar en servidor requeriría Durable Objects o un servicio externo.

## Decision

- **Procesamiento**: en el navegador, previo a la subida.
- **Librerías**: `canvas` nativa (Web API), `heic2any` para convertir HEIC a JPEG, `exifr` para leer (no guardar) metadatos.
- **Validación servidor**: tipo (JPEG, PNG, WebP, HEIC), tamaño (<10MB), dimensiones mínimas (ej. 200×200).
- **Flujo**:
  1. Usuario elige foto.
  2. Navigator.mediaDevices (o input file).
  3. Leer EXIF con `exifr` (para rotar basado en orientación).
  4. Convertir HEIC a JPEG con `heic2any` si aplica.
  5. Dibujar en canvas a los 3 tamaños y exportar como WebP.
  6. Subir original + 3 derivadas a R2.
  7. Servidor valida que llegaron bien y actualiza BD.

## Rationale

- **Sin costo de compute en servidor**: canvas corre gratis en el navegador.
- **Feedback inmediato**: el usuario ve el preview del WebP antes de subir.
- **Menos datos móviles**: los datos se comprimen en el celular.
- **Offline-ready**: si se quiere PWA, Canvas funciona sin conexión (aunque R2 requiere red).

## Consequences

- Navegadores sin soporte Canvas: la función cae (error claro: "Tu navegador es muy antiguo").
- HEIC en navegadores no Safari: requiere librería `heic2any`. Si falla, mostrar error.
- La responsabilidad de calidad está en el navegador del usuario. Si el celular es muy antiguo, el Canvas será lento.
- Hay que testear con el celular real de la administradora (constitución, Principio II).

## Alternatives Considered

1. **Procesar en servidor con Sharp en un Durable Object**: posible, pero agrega complejidad. Cuesta más (aunque sigue siendo gratuito en la capa free de Durable Objects, hay límites).
2. **Servicio externo (Cloudinary, Imgix)**: gratuito pero limitado.
3. **No procesar, solo validar tamaño**: no cumple HU-08 (optimización automática).

## References

- Principio II: Rendimiento y Accesibilidad
- HU-08: Optimización automática de la foto
- Principio III: Privacidad (eliminar metadatos)
- ADR 0002: Stack Tecnológico
- ADR 0004: Almacenamiento de Imágenes
