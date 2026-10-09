# Samuelé Repostería

Sitio web de Samuelé Repostería: catálogo de pasteles y postres. Esta primera versión es un esqueleto desplegado de punta a punta: página de inicio con la identidad del negocio, validación automática de cada cambio y publicación automática en Cloudflare Workers.

## Requisitos previos

- Node 22 (`nvm use` lee `.nvmrc`) y npm.

## Levantar en local

```bash
npm ci
npm run dev                        # http://localhost:4321
npm run build && npm run preview   # igual que producción
```

Para probar en un celular real en la misma red: `npm run dev -- --host` y abrir `http://<IP-de-la-computadora>:4321`.

## Verificaciones

```bash
npm run check          # tipos (astro check)
npm run lint           # ESLint
npm run format:check   # Prettier
npm test               # Vitest
```

## Estructura

```text
src/layouts/      # BaseLayout: html, meta viewport, fuentes y estilos globales
src/components/   # BrandHeader: logo, nombre y lema
src/pages/        # index.astro (inicio) y 404.astro
src/styles/       # global.css: variables de color y tipografía
tests/            # pruebas con Vitest
.github/workflows/  # ci.yml y deploy.yml
docs/adr/         # decisiones de arquitectura
```

## Validación de un PR

Cada PR ejecuta `ci.yml`: tipos, estilo, pruebas y build. Lighthouse corre como job informativo (no bloquea) y sube su reporte como artefacto. La plantilla del PR pide registrar la prueba en celular real. `main` solo admite cambios por PR con squash.

## Publicación

Al fusionar en `main`, `deploy.yml` vuelve a validar, construye y publica con `wrangler deploy` en `https://<worker>.<subdominio>.workers.dev`. No hay vista previa por PR. Requiere los secretos de GitHub `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` (pasos en [quickstart.md](specs/001-project-skeleton/quickstart.md)); nunca se guardan en el repositorio.

## Si algo falla

- **Falló la publicación**: el sitio anterior sigue sirviendo. Reintentar con "Re-run jobs" o "Run workflow" en Actions.
- **Se publicó algo malo**: `npx wrangler rollback`, y luego un PR con `git revert` para que `main` y producción coincidan.

## Documentación

- Decisiones: [docs/adr/](docs/adr/), incluido el [ADR 0008](docs/adr/0008-herramientas-de-desarrollo.md) de herramientas.
- Guía de la funcionalidad: [specs/001-project-skeleton/quickstart.md](specs/001-project-skeleton/quickstart.md).
