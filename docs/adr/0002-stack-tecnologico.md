# ADR 0002: Stack Tecnológico

**Status**: Accepted

**Date**: 2026-10-05

## Context

La Fase 1 requiere:
- Catálogo público mobile-first con Lighthouse ≥90 (Principio II).
- Panel de administración usable desde celular (HU-06, HU-07).
- Costo recurrente $0 sin servidores que se duerman (Principio I).
- Un solo lenguaje de punta a punta para mantener coherencia y facilitar onboarding.

El stack debe soportar fotos con procesamiento de metadatos y múltiples derivadas sin cold starts ni suspensión por inactividad.

## Decision

- **Frontend**: Astro (pages estáticas del catálogo) + React (panel interactivo).
- **Backend**: Hono en Cloudflare Workers.
- **Lenguaje**: TypeScript de punta a punta.
- **Deployment**: Cloudflare Pages (frontend) + Cloudflare Workers (backend).

## Rationale

- **Sin cold starts**: Workers ejecutan en <50ms; no hay suspensión por inactividad.
- **Lighthouse**: Astro renderiza HTML estático para el catálogo. Las métricas de Core Web Vitals mejoran sin JavaScript innecesario.
- **Un lenguaje**: TypeScript reduce contexto cognitivo. El usuario ya practica TypeScript en este proyecto (objetivo de portafolio).
- **Hono**: similar a Flask (rutas, middlewares), pero nativa en Workers. Curva de aprendizaje suave.
- **Astro + React**: React en islas solo donde se necesita interactividad (panel). El catálogo es casi estático.

## Consequences

- Curva de aprendizaje en Workers, D1 y R2 (capas nuevas de Cloudflare).
- SQLite (D1) en lugar de Postgres. Suficiente para Fase 1 y 2; migración posible en Fase 3+ si escala.
- Sin librerías pesadas de procesamiento de imágenes en servidor (sharp no corre en Workers).

## Alternatives Considered

1. **Flask + React + Postgres en Render/Railway**: dominas el stack, pero los servidores gratuitos se duermen tras 15 min de inactividad. Rechazado.
2. **Next.js en Vercel**: más simple, pero Vercel no tiene almacenamiento gratuito. R2 no integra bien con Vercel. Rechazado.
3. **SvelteKit en Cloudflare Pages**: equivalente a Astro + React. Elegimos Astro por su mejor rendimiento en catálogos estáticos.

## References

- Principio I: Costo Cero para el Negocio
- Principio II: Móvil Primero, Rendimiento y Accesibilidad
- HU-14: Despliegue y CI
- Documento de contexto, § 8: Requisitos no funcionales iniciales
