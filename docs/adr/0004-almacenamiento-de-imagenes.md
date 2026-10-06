# ADR 0004: Almacenamiento de Imágenes

**Status**: Accepted

**Date**: 2026-10-05

## Context

HU-08 requiere:
- Subida de fotos editadas (originales sin modificación).
- Generación automática de derivadas (miniatura, mediano, grande) en WebP.
- Eliminación de metadatos (EXIF, GPS).
- Costo recurrente $0 sin cargos por egreso de datos.

## Decision

- **Almacenamiento**: R2 (Cloudflare).
- **Estructura**:
  ```
  r2://samuelé-bucket/
  ├── originals/{workId}.{ext}
  ├── thumbs/{workId}.webp
  ├── medium/{workId}.webp
  └── large/{workId}.webp
  ```

## Rationale

- **Capa gratuita R2**: 10GB almacenamiento, sin cargo por egreso de datos (a diferencia de S3).
- **Integración Workers**: el procesamiento de derivadas (vía Canvas en el navegador, ver ADR 0005) genera WebP en el cliente; el servidor solo valida y guarda.
- **URLs públicas**: R2 genera URLs permanentes que sirven desde el CDN de Cloudflare.

## Consequences

- Las derivadas (thumb, medium, large) se generan en el navegador y se suben como archivos separados. Si el navegador no soporta Canvas, la subida falla (graceful degradation: mostrar error claro).
- El original se guarda sin modificar (respaldo y futura edición).
- Limpieza manual: si se retira un trabajo, hay que borrar sus derivadas de R2 (habrá un job de limpieza en el backend).

## Alternatives Considered

1. **S3 (AWS)**: capa gratuita limitada y cargos por egreso. Rechazado.
2. **Procesamiento en servidor con Sharp**: no corre en Workers. Habría que usar Durable Objects (más complejo) o un edge function adicional. Rechazado.
3. **Imgix/Cloudinary**: tienen capa gratuita, pero con límites de transformaciones. Rechazado.

## References

- Principio I: Costo Cero para el Negocio
- Principio II: Rendimiento
- HU-08: Optimización automática de la foto
- ADR 0002: Stack Tecnológico
