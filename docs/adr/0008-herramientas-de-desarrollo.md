# ADR 0008: Herramientas de desarrollo

- **Estado**: aceptada
- **Fecha**: 2026-10-08

## Contexto

El esqueleto desplegado (funcionalidad 001) necesita un conjunto mínimo de herramientas de desarrollo, pruebas y CI. El stack base ya está decidido en los ADR 0002 y 0007; aquí se registran las herramientas auxiliares y por qué se eligieron. Las razones detalladas están en `specs/001-project-skeleton/research.md`.

## Decisión

- **Gestor de paquetes: npm** (D1), con `package-lock.json` y `npm ci` en CI. Viene con Node y no añade nada que instalar.
- **Node 22 LTS** (D2), fijado en `.nvmrc` y `engines`. Su soporte termina en abril de 2027: revisar el salto a Node 24 en el hito siguiente.
- **TypeScript 6.0.x, no 7** (D3): `@astrojs/check` y `typescript-eslint` aún no declaran compatibilidad con la versión 7.
- **Vitest con la API de contenedor de Astro** (D4) para renderizar páginas a HTML y comprobar el contenido esencial. Se construye la configuración de Astro sin el adaptador de Cloudflare al probar (R1).
- **ESLint + Prettier** (D5), con `eslint-plugin-astro` y `eslint-plugin-jsx-a11y-x` (el plugin `jsx-a11y` original no declara compatibilidad con ESLint 10, R2).
- **`astro check`** para tipos en `.astro` y `.ts` (D6).
- **Lighthouse CI informativo** (D7): job aparte, no obligatorio, reportes como artefacto de Actions; rendimiento y accesibilidad ≥90 como meta.

## Consecuencias

- Costo recurrente $0: todas las herramientas son de código abierto y se ejecutan en GitHub Actions gratuito (principio I).
- Lighthouse no bloquea la fusión; la revisión queda en la plantilla del PR.
- Hay que revisar TypeScript 7 y Node 24 cuando las herramientas amplíen su compatibilidad.

## Alternativas consideradas

1. **pnpm / yarn**: sin ventaja para un proyecto único.
2. **Jest**: más configuración para Vite/Astro que Vitest.
3. **Lighthouse como requisito obligatorio**: descartado por la spec (puede dar falsos negativos por variación del entorno).

## Referencias

- Constitución: principios I, V y VII.
- `specs/001-project-skeleton/research.md`.
- ADR 0002 y ADR 0007.
