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

## Panel de la administradora

El panel vive en `/admin` y exige iniciar sesión en `/admin/login` (ADR 0006). La credencial es un secreto del Worker, no está en el repositorio ni en la base.

**Configuración local**

```bash
cp .dev.vars.example .dev.vars               # editar ADMIN_EMAIL y ADMIN_PASSWORD (ignorado por git)
npx wrangler d1 migrations apply DB --local  # crea las tablas sessions y login_attempts
```

**Configuración en producción (una sola vez)**

```bash
npx wrangler d1 create samuele-reposteria    # copiar el database_id a wrangler.jsonc
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD       # aleatoria, de al menos 20 caracteres
```

El token de Cloudflare del repositorio necesita el permiso **D1: Edit**: `deploy.yml` aplica las migraciones antes de publicar.

**Invalidar todas las sesiones** (cambio de credencial o celular perdido):

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler d1 execute DB --remote --command "DELETE FROM sessions"
```

Tras 5 intentos fallidos en 15 minutos el acceso se bloquea 15 minutos. Para levantar el bloqueo antes: `npx wrangler d1 execute DB --remote --command "DELETE FROM login_attempts"`.

Si cambias `wrangler.jsonc`, regenera los tipos con `npx wrangler types`.

## Trabajos y fotos

`/admin` lista "Mis trabajos" y `/admin/works/new` publica uno (foto, categoría, título y descripción opcionales). La foto se optimiza en el navegador (ADR 0005) y `POST /api/admin/works` la valida y la guarda: originales privadas y derivadas públicas en R2 (binding `MEDIA`, bucket `samuele-media`), datos en D1 (tablas `categories` y `works`). Las derivadas se sirven en `GET /media/works/...`.

**Probar en local**: `npx wrangler d1 migrations apply DB --local` (crea las tablas y las 4 categorías) y `npm run dev`; R2 usa un bucket simulado local. Pasos completos en [quickstart.md](specs/003-panel-nuevo-trabajo/quickstart.md).

**Requisito previo de producción (una sola vez, antes de fusionar)**: activar R2 en la cuenta de Cloudflare con una alerta de facturación y crear el bucket. `deploy.yml` falla si no existe.

```bash
npx wrangler r2 bucket create samuele-media
```

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
src/components/   # BrandHeader, PanelHeader, WorksPanel, WorkCard, WorkForm y NewWorkView
src/pages/        # index.astro (inicio), 404.astro, admin/ (login, lista y nuevo trabajo), api/admin/ (logout y works) y media/
src/lib/auth/     # autenticación: credenciales, sesiones, bloqueo, Origin y almacén D1
src/lib/works/    # trabajos: validación, bytes de imagen, claves R2, caso de uso y almacenes
src/lib/photo/    # optimización de la foto en el navegador
src/scripts/      # work-form.ts: lógica del formulario
src/db/           # schema.ts (Drizzle): sessions, login_attempts, categories y works
src/middleware.ts # protege /admin/* y /api/admin/*
migrations/       # SQL de D1 generado con drizzle-kit
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
- Guía del inicio de sesión: [specs/002-admin-login/quickstart.md](specs/002-admin-login/quickstart.md).
- Guía de la funcionalidad: [specs/001-project-skeleton/quickstart.md](specs/001-project-skeleton/quickstart.md).
