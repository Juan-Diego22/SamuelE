# Quickstart: correr, probar y desplegar el esqueleto

Guía de validación de la funcionalidad 001. Los comandos suponen que ya existe el proyecto implementado (`tasks.md`). Decisiones y razones: [research.md](research.md).

## 0. Requisitos previos

- Node 22 (`nvm use` lee `.nvmrc`) y npm.
- Una cuenta gratuita de Cloudflare y acceso al repositorio en GitHub.
- Un celular real en la misma red Wi-Fi que la computadora (para la prueba móvil).

## 1. Correr en local

```bash
npm ci
npm run dev          # servidor de desarrollo (workerd), http://localhost:4321
npm run build && npm run preview   # igual que producción
```

**Resultado esperado**: se ve el logo circular, "Samuelé Repostería", "Creamos momentos dulces" y el mensaje de catálogo próximo. Una ruta inexistente (`/xyz`) muestra la página 404 amable con enlace al inicio.

**Prueba en celular real** (SC-004): abrir `http://<IP-de-la-computadora>:4321` (usar `npm run dev -- --host`) y comprobar sin desplazamiento horizontal. Marcar la casilla del PR con modelo, navegador y fecha.

## 2. Configurar los secretos de despliegue (una sola vez)

1. **Subdominio `workers.dev`**: en el panel de Cloudflare, Workers & Pages, registrar el subdominio de la cuenta si aún no existe.
2. **Account ID**: panel de Cloudflare → página de inicio de la cuenta → copiar "Account ID".
3. **API token**: Cloudflare → Manage Account → Account API tokens → Create Token → Custom → permiso "Edit Cloudflare Workers", limitado a tu cuenta. Copiar el token (solo se muestra una vez).
4. **GitHub**: repositorio → Settings → Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN` = el token del paso 3
   - `CLOUDFLARE_ACCOUNT_ID` = el ID del paso 2

Nunca se escriben en el repositorio, en `wrangler.jsonc` ni en archivos `.env` versionados.

## 3. Probar

```bash
npm run check          # tipos (astro check)
npm run lint           # ESLint
npm run format:check   # Prettier
npm test               # Vitest
```

**Resultado esperado**: los cuatro terminan sin errores. Para ver fallar la validación, romper a propósito un tipo o una prueba en una rama y abrir un PR: el flujo debe quedar en rojo (SC-006, sujeto a la decisión sobre protección de rama).

**Lighthouse local** (informativo): `npx lhci autorun` con el build previo; metas ≥90 en rendimiento y accesibilidad.

## 4. Desplegar

1. Abrir un PR; esperar el flujo `ci` en verde.
2. Fusionar con squash en `main`.
3. El flujo `deploy` valida, construye y publica solo. Seguirlo en la pestaña Actions.
4. Abrir la URL `https://<worker>.<subdominio>.workers.dev` y comprobar el cambio (SC-005: ≤ 10 min).

Publicación manual de emergencia: Actions → `deploy` → "Run workflow".

## 5. Si el despliegue falla o publica algo malo

- **Falló la publicación**: el sitio anterior sigue sirviendo. La ejecución queda en rojo en Actions con su registro. Reintentar con "Re-run jobs" si fue un fallo externo.
- **Se publicó una versión mala**: `npx wrangler rollback` (pide confirmación; con `-m "motivo"` documenta la razón) o el botón de rollback en Cloudflare. Luego abrir un PR con `git revert` del cambio para que `main` y producción coincidan.

## 6. Medir el consumo real de CPU de la página desplegada

```bash
for i in $(seq 1 100); do curl -s -o /dev/null https://<worker>.<subdominio>.workers.dev/; done
```

Esperar unos minutos y abrir Cloudflare → Workers & Pages → el Worker → Metrics → "CPU time per execution".

**Resultado esperado**: P99 ≤ 10 ms y P50 ≤ 3 ms (umbrales propuestos). Anotar los valores y la fecha en el PR; si P99 se acerca a 10 ms, registrarlo en una actualización del ADR 0002. Si la gráfica no está disponible en el plan gratuito, consultar la API GraphQL de analítica de Workers.
