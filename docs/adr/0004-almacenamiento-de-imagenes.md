# ADR 0004: Almacenamiento de imágenes

- **Estado**: aceptada
- **Fecha**: 2026-10-05
- **Revisión**: 2026-10-06. Se verifican límites. Las imágenes se sirven a través del Worker, porque `r2.dev` es solo para desarrollo. Se corrige el nombre del bucket, se documenta que R2 exige registrar un medio de pago y se reemplaza el "job de limpieza" por retiro lógico.

## Contexto

HU-08 pide guardar cada foto en varios tamaños optimizados y conservar la original (documento de contexto, Fase 1). El principio III exige que lo publicado no exponga metadatos como la ubicación GPS. Las imágenes son lo más pesado del sitio y lo que más se descarga.

## Decisión

- **Servicio**: Cloudflare R2, un bucket privado llamado `samuele-media` (los nombres de bucket no admiten tildes).
- **Estructura de claves**:
  ```
  originals/{workId}-{version}.jpg          privada, nunca se sirve
  works/{workId}-{version}/sm.{webp|jpg}    miniatura (grilla)
  works/{workId}-{version}/md.{webp|jpg}    mediana (detalle en celular)
  works/{workId}-{version}/lg.{webp|jpg}    grande (detalle en escritorio)
  ```
  `version` cambia al reemplazar la foto (HU-09). Así cada URL es inmutable y se puede cachear para siempre.
- **Entrega**: el Worker sirve `GET /media/works/...` leyendo de R2 por binding, con `Cache-Control: public, max-age=31536000, immutable`. La ruta `originals/` no tiene endpoint público.
- **Retiro (HU-10)**: retirar un trabajo lo oculta del catálogo (borrado lógico) y no borra archivos. El borrado físico queda fuera de la Fase 1.

## Verificación de costos (principio I)

Consultado el 2026-10-06 en [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

| Límite (capa gratuita, clase Standard) | Valor |
|---|---|
| Almacenamiento | 10 GB-mes |
| Operaciones clase A (escrituras) | 1 millón/mes |
| Operaciones clase B (lecturas) | 10 millones/mes |
| Egreso | Gratis |

- **Holgura**: con una original de unos 3 MB y derivadas por menos de 0,5 MB, cada trabajo ocupa cerca de 3,5 MB. Caben unos 2.800 trabajos.
- **Medio de pago**: activar R2 exige registrar una tarjeta o PayPal en la cuenta de Cloudflare, aunque no cobra dentro de la capa gratuita. A diferencia de Workers y D1, **R2 sí factura si se supera la capa gratuita**. Hay que configurar una alerta de facturación en la cuenta.
- **`r2.dev`**: según la [documentación](https://developers.cloudflare.com/r2/buckets/public-buckets/) tiene límite de velocidad y es "solo para desarrollo". Por eso no se usa.

## Consecuencias

- Cada imagen servida consume un request del Worker (100.000/día, ADR 0002) y una lectura clase B. La caché del navegador evita repetirlos en visitas recurrentes.
- Sin dominio propio no se usa la caché de borde de Cloudflare para las imágenes. Si se compra un dominio, se puede activar después sin cambiar las claves.
- Guardar la original permite regenerar derivadas en el futuro (por ejemplo, la edición automática de la Fase 2). Al ser privada, su EXIF nunca se expone.

## Alternativas consideradas

1. **Bucket público en `r2.dev`**: descartada por ser solo para desarrollo.
2. **Cloudflare Images (almacenamiento)**: requiere plan de pago.
3. **Amazon S3**: la capa gratuita dura 12 meses y cobra egreso.
4. **Guardar imágenes en D1**: descartada por el límite de 500 MB por base y por ser un mal uso de la base.

## Referencias

- Constitución: principios I, II y III.
- PRD Fase 1: HU-07, HU-08, HU-09, HU-10.
- ADR 0002, ADR 0005.
