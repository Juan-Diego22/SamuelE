# ADR 0003: Base de Datos

**Status**: Accepted

**Date**: 2026-10-05

## Context

La Fase 1 necesita:
- Catálogo con trabajos, categorías y metadatos de foto.
- Autenticación de un usuario (administradora).
- Modelo relacional simple: User (1:N) Works, Categories (1:N) Works.

Fases 2a y 2b agregarán inventario y recetas, pero con volumen muy pequeño (<1000 registros).

## Decision

- **Database**: D1 (SQLite) en Cloudflare.
- **ORM/Migrations**: Drizzle ORM.

## Rationale

- **Capa gratuita D1**: 5GB almacenamiento, suficiente para todos los metadatos de Fase 1+2.
- **Integración Workers**: D1 está en la misma plataforma; sin latencia de red externa.
- **Drizzle**: migrations versionadas en Git, TypeScript-first, sin magia.
- **Escalabilidad**: migración a Postgres es posible en Fase 3+ si se necesita.

## Consequences

- No transactions complejas (ACID limitado). Fase 1 no las requiere.
- SQLite tiene límites de concurrencia; si llegan 100+ ediciones simultáneas en Fase 2, habrá contención. Improbable en este caso (1 administradora).
- Backups: no automáticos en la capa gratuita. Hay que automatizar con GitHub Actions.

## Alternatives Considered

1. **Postgres en Neon**: capa gratuita, pero requiere un servidor siempre activo. Rechazado.
2. **Firebase Realtime DB**: no SQL, difícil hacer reports en Fase 2. Rechazado.
3. **Turso (SQLite distribuido)**: más caro en la capa gratuita. Rechazado.

## References

- Principio I: Costo Cero para el Negocio
- ADR 0002: Stack Tecnológico
- Documento de contexto, § 12: decisiones pendientes (base de datos)
