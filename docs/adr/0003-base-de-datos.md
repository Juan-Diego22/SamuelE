# ADR 0003: Base de datos

- **Estado**: aceptada
- **Fecha**: 2026-10-05
- **Revisión**: 2026-10-06. Límites verificados contra la documentación oficial. Se corrigen afirmaciones sobre backups, transacciones y alternativas, y se quita la tabla de usuarios (ver ADR 0006).

## Contexto

La Fase 1 guarda categorías, trabajos y la referencia a sus fotos, además de las sesiones del panel. Las fases 2a y 2b agregarán inventario, movimientos y recetas: datos relacionales, pero de volumen pequeño (cientos o pocos miles de filas). La base debe ser gratuita con uso comercial y estar cerca del Worker (ADR 0002).

## Decisión

- **Motor**: Cloudflare D1 (SQLite administrado), con binding directo desde el Worker.
- **Acceso y migraciones**: Drizzle ORM. Las migraciones se versionan en el repositorio y se aplican con `wrangler d1 migrations apply`.
- **Modelo inicial (Fase 1)**: `categories`, `works`, `sessions`, `login_attempts`. No hay tabla de usuarios: la única administradora se define con secretos del Worker (ADR 0006).
- **Respaldo**: Time Travel de D1 (recuperación a cualquier punto de los últimos 7 días), más una exportación manual con `wrangler d1 export` antes de cada migración de esquema.

## Verificación de costos (principio I)

Consultado el 2026-10-06 en [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) y [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

| Límite (plan gratuito) | Valor |
|---|---|
| Filas leídas | 5 millones/día |
| Filas escritas | 100.000/día |
| Almacenamiento total | 5 GB |
| Tamaño máximo por base | 500 MB |
| Bases por cuenta | 10 |
| Time Travel | 7 días |
| Consultas por invocación | 50 |

- **Al exceder límites**: las consultas devuelven error hasta el día siguiente; no hay cobro.
- **Holgura**: solo se guardan metadatos (las fotos van en R2). Mil trabajos ocupan pocos MB, y una visita al catálogo lee del orden de decenas de filas.

## Consecuencias

- Las fotos nunca van a la base: solo sus claves en R2.
- D1 procesa las consultas de una en una por base. Con una sola administradora y tráfico bajo no es un problema.
- SQLite tiene menos tipos que Postgres (por ejemplo, fechas como texto ISO o enteros). Drizzle lo abstrae.
- Hay que tener cuidado con las consultas que recorren tablas completas, porque las filas leídas cuentan. Se usan índices en `category_id` y en el orden de publicación.
- **Salida**: Drizzle también soporta Postgres. Migrar implica ajustar tipos y el driver, no reescribir la lógica.

## Alternativas consideradas

1. **Postgres en Neon**: tiene capa gratuita y escala a cero, así que también serviría. Se descarta por agregar un proveedor y una cuenta más, y conexión por red desde el Worker. Queda como primera opción si se migra a Postgres.
2. **Turso (libSQL)**: también tiene una capa gratuita amplia. Se descarta por ser otro proveedor, sin ventaja clara frente a D1 dentro de Cloudflare.
3. **Postgres en Docker**: es lo conocido en desarrollo, pero no existe un hosting gratuito estable para producción.

## Referencias

- Constitución: principios I y VII.
- PRD Fase 1: HU-01, HU-06 a HU-11.
- ADR 0002, ADR 0006.
