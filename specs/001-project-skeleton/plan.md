# Implementation Plan: Esqueleto desplegado de punta a punta

**Branch**: `feature/001-project-skeleton` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-project-skeleton/spec.md`

## Summary

Proyecto único con Astro y el adaptador de Cloudflare que publica una página de inicio con la identidad del negocio (logo, nombre, lema, mensaje "catálogo pronto") en un Worker de Cloudflare con URL `workers.dev`. Una canalización de GitHub Actions valida cada PR (tipos, estilo, pruebas, build, más Lighthouse informativo) y publica automáticamente al fusionar en `main`. Sin base de datos, almacenamiento, API ni autenticación. Las decisiones de herramientas están en [research.md](research.md); el stack viene de los ADR 0002 y 0007.

## Decisión sobre la protección de `main` (resuelta 2026-10-08)

El repositorio era privado en GitHub gratuito, que no ofrece protección de ramas. Se eligió la opción A: **repositorio público**. Ya está aplicado el ruleset `protect-main` (solo PR con squash, sin borrado ni push forzado, sin bypass para la administradora). **Falta** agregar el check de CI como obligatorio; no se pudo antes porque el flujo `ci.yml` aún no existe y exigir un check inexistente bloquearía todas las fusiones. Es una tarea de esta funcionalidad (ver D14 en [research.md](research.md#d14-protección-de-main-resuelto)).

## Technical Context

**Language/Version**: TypeScript ~6.0.3 sobre Node 22 LTS (`.nvmrc`)

**Primary Dependencies**: Astro ^7.3, `@astrojs/cloudflare` ^14.3, `wrangler` ^4.149, `@fontsource/dancing-script` (ADR 0007), `sharp` (logo en build)

**Storage**: N/A (sin D1, R2 ni KV; `session: false`)

**Testing**: Vitest ^5 con la API de contenedor de Astro; ESLint ^10 + typescript-eslint + eslint-plugin-astro; Prettier ^3.9; `astro check`; Lighthouse CI (informativo)

**Target Platform**: Cloudflare Workers (plan gratuito) con static assets; navegadores móviles y de escritorio, incluidos los antiguos mediante mejora progresiva (FR-003a)

**Project Type**: Aplicación web de un solo proyecto Astro (sin `backend/` ni `frontend/`)

**Performance Goals**: Lighthouse móvil ≥90 en rendimiento y accesibilidad (informativo en PR); CPU del Worker P99 ≤ 10 ms por request (medido ya desplegado)

**Constraints**: costo recurrente $0; 10 ms de CPU y 100.000 requests/día; ningún secreto en el repositorio; contraste ≥4.5:1; cuerpo ≥16 px; sin desplazamiento horizontal desde 320 px

**Scale/Scope**: 2 páginas (inicio y 404), 1 fuente, 1 imagen, 2 flujos de CI

## Constitution Check

*GATE: antes de la investigación y re-evaluado tras el diseño.*

| Principio | Estado | Nota |
|---|---|---|
| I. Costo cero | ✅ | Workers gratuito, sin KV ni Images (D8), Actions gratuito, herramientas de código abierto. |
| II. Móvil, rendimiento, a11y | ⚠️ | Móvil primero, contraste y `alt` cubiertos. Lighthouse ≥90 es meta pero informativo por decisión de la spec; la prueba en celular real se registra en el PR (SC-004). |
| III. Privacidad y seguridad | ✅ | Sin secretos en el repo (solo en GitHub Secrets); EXIF del logo eliminado en el build (D10). |
| IV. Alcance disciplinado | ✅ | Sin catálogo, WhatsApp, login, panel ni datos (FR-014). |
| V. Calidad verificable | ✅ | Pruebas del contenido esencial (FR-010) y del 404. |
| VI. Entrega continua | ⚠️ | CI en cada PR y deploy desde `main`. `main` ya exige PR; falta marcar el check de CI como obligatorio al crear `ci.yml`. |
| VII. Decisiones y documentación | ⚠️ | README en alcance. Falta un **ADR 0008** con las herramientas elegidas (npm, Vitest, ESLint/Prettier, Lighthouse CI, Node 22); va como tarea. |

**Re-evaluación tras el diseño**: sin cambios. No hay violaciones que justificar en Complexity Tracking, salvo la del principio VI, que depende de la decisión del usuario y no de la complejidad.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-skeleton/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones de herramientas y hallazgos
├── data-model.md        # N/A: no hay datos de negocio
├── contracts/           # N/A: no hay API, base de datos ni autenticación
├── quickstart.md        # Fase 1: correr, probar, desplegar, revertir, medir CPU
└── tasks.md             # /speckit-tasks (no lo crea este comando)
```

### Source Code (repository root)

```text
.github/
├── workflows/
│   ├── ci.yml                 # PR + workflow_call: tipos, estilo, pruebas, build; job Lighthouse (informativo)
│   └── deploy.yml             # push a main (+ manual): llama a ci.yml y luego wrangler deploy
└── pull_request_template.md   # casilla de prueba en celular real (SC-004)
src/
├── assets/
│   └── logo-samuele.jpg       # copia de docs/design/SamuelE.jpg
├── components/
│   └── BrandHeader.astro      # logo circular + nombre + lema
├── layouts/
│   └── BaseLayout.astro       # <html lang="es">, meta viewport, fuentes, estilos globales
├── pages/
│   ├── index.astro            # inicio (prerender = false, ver D9)
│   └── 404.astro              # logo, mensaje amable, enlace al inicio
└── styles/
    └── global.css             # variables de color, tipografía, móvil primero
tests/
├── home.test.ts               # nombre, lema, mensaje, alt del logo, lang="es"
└── not-found.test.ts          # mensaje y enlace al inicio
astro.config.mjs               # adapter cloudflare, session:false, imageService:'compile'
wrangler.jsonc                 # name, compatibility_date/flags, observability; sin bindings
vitest.config.ts
eslint.config.js
.prettierrc
lighthouserc.json              # móvil, 3 corridas, aserciones warn ≥0.9, salida a filesystem
tsconfig.json
package.json / package-lock.json
.nvmrc                         # 22
README.md
docs/adr/0008-herramientas-de-desarrollo.md   # ADR de herramientas (tarea)
```

**Structure Decision**: un solo proyecto Astro en la raíz. Se ordena por responsabilidad (`layouts`, `components`, `pages`, `styles`) para cumplir el principio VII y crecer en hitos posteriores sin reorganizar. No existen `backend/` ni `frontend/`.

## Flujos

### CI en cada PR (`ci.yml`)

1. `actions/checkout`, `actions/setup-node` (versión desde `.nvmrc`, caché de npm), `npm ci`.
2. `npm run check` (`astro check`: tipos), `npm run lint`, `npm run format:check`, `npm test`, `npm run build`.
3. Job aparte `lighthouse` (solo en `pull_request`, `continue-on-error: true`, no requerido): `npm run build`, `lhci autorun` sobre `astro preview`, reporte como artefacto.
4. Permisos mínimos (`contents: read`). Sin secretos en este flujo.

### Despliegue al fusionar (`deploy.yml`)

1. Disparador: `push` a `main` y `workflow_dispatch`. `concurrency: { group: deploy, cancel-in-progress: false }`.
2. Job `validate`: llama a `ci.yml` (`workflow_call`) para no publicar nada que no pase tipos, estilo y pruebas.
3. Job `deploy` (`needs: validate`): `npm ci`, `npm run build`, `cloudflare/wrangler-action@v4` con `apiToken` y `accountId` desde secretos, comando `deploy`.
4. **Secretos en GitHub** (Settings → Secrets and variables → Actions): `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`. Creación paso a paso en [quickstart.md](quickstart.md#2-configurar-los-secretos-de-despliegue-una-sola-vez).

### Reversión y medición de CPU

Resumidos en [research.md](research.md#d12-reversión-de-un-despliegue-fallido) (D12) y [research.md](research.md#d13-medir-el-consumo-real-de-cpu) (D13); los pasos ejecutables están en [quickstart.md](quickstart.md).

## Trazabilidad con la spec

| Requisito | Dónde se cubre |
|---|---|
| FR-001–FR-005, FR-003a | `BaseLayout`, `BrandHeader`, `index.astro`, `global.css`, D10 |
| FR-006, FR-010 | `ci.yml`, `tests/` |
| FR-007 | Ruleset `protect-main` (hecho) + check de CI obligatorio (tarea) |
| FR-008, FR-008a | `deploy.yml`; sin vista previa por PR |
| FR-009 | Atomicidad de `wrangler deploy`, ejecución en rojo en Actions |
| FR-011 | `README.md` |
| FR-012, FR-013 | D8, GitHub Secrets, ADR 0008 |
| FR-014 | Sin bindings en `wrangler.jsonc`, `session: false` |
| FR-015 | URL `workers.dev` (ADR 0002) |
| SC-001 | Job `lighthouse` |
| SC-004 | `pull_request_template.md` |
| SC-005 | Duración del flujo de despliegue, medida en la primera fusión |

## Complexity Tracking

Sin violaciones que justificar por complejidad.
