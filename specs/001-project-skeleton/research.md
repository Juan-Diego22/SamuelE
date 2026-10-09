# Investigación (Fase 0): Esqueleto desplegado de punta a punta

**Fecha de consulta**: 2026-10-08. Las versiones son las que `npm view` devolvió ese día.

Decisiones **heredadas y no reabiertas**: ADR 0002 (Astro + adaptador de Cloudflare, un solo Worker, TypeScript, GitHub Actions con `wrangler deploy`, URL `workers.dev`) y ADR 0007 (Dancing Script autoalojada).

## Decisiones nuevas

### D1. Gestor de paquetes: npm

- **Decisión**: npm con `package-lock.json` y `npm ci` en CI.
- **Razón**: viene con Node, no hay nada extra que instalar ni fijar (pnpm no está instalado en la máquina y `corepack` es una dependencia más). El proyecto es único, sin monorepo, y no justifica otro gestor.
- **Alternativas**: pnpm (instalaciones más rápidas, no hace falta aquí); yarn (sin ventaja).

### D2. Versión de Node: 22 LTS

- **Decisión**: Node 22, fijado en `.nvmrc` y en `engines` de `package.json` (`>=22.12.0`). CI usa `node-version-file: .nvmrc`.
- **Razón**: coincide con la máquina de desarrollo (22.22.1) y cumple los requisitos de Astro 7 (`>=22.12.0`), Wrangler 4 (`>=22`) y Vitest 5 (`^22.12`).
- **Riesgo**: Node 22 entra en mantenimiento y termina su soporte en abril de 2027. Revisar el salto a Node 24 en el hito siguiente (todos los paquetes elegidos lo aceptan).

### D3. TypeScript fijado en 6.0.x (no 7)

- **Decisión**: `typescript@~6.0.3`.
- **Razón**: `latest` en npm es 7.0.2, pero `@astrojs/check` declara `typescript ^5 || ^6` y `typescript-eslint` declara `>=4.8.4 <6.1.0`. Con TS 7 la verificación de tipos de Astro y el linter quedarían fuera de rango.
- **Revisar** cuando esas dos herramientas amplíen su rango.

### D4. Ejecutor de pruebas: Vitest

- **Decisión**: `vitest@^5` con `getViteConfig` de `astro/config` y la API de contenedor de Astro (`AstroContainer`) para renderizar `index.astro` y `404.astro` a HTML y comprobar el contenido (nombre, lema, mensaje, `alt` del logo, `lang="es"`).
- **Razón**: es el ejecutor que Astro documenta, comparte configuración de Vite, es de código abierto y gratuito. Astro 7 usa Vite 8, que entra en el rango de Vitest 5.
- **No se usa** `@cloudflare/vitest-pool-workers` (exige Vitest 4.1 y esta funcionalidad no tiene lógica de Worker que probar).
- **Riesgo R1**: que el plugin del adaptador de Cloudflare estorbe dentro de Vitest. Mitigación: si ocurre, `vitest.config.ts` construye la configuración de Astro sin el adaptador (los componentes no dependen de él).

### D5. Linter y formateador: ESLint + Prettier

- **Decisión**: `eslint@^10` con `typescript-eslint` y `eslint-plugin-astro@^3.2` (reglas de accesibilidad para `.astro` incluidas), y `prettier@^3.9` con `prettier-plugin-astro`. Scripts `lint` y `format:check`.
- **Razón**: son el estándar de Astro, gratuitos y de código abierto. `eslint-plugin-astro` 3.2 exige ESLint ≥10.
- **Riesgo R2**: `eslint-plugin-jsx-a11y` (peer de `eslint-plugin-astro`) puede no declarar compatibilidad con ESLint 10. Verificar al instalar; si falla, usar `eslint-plugin-jsx-a11y-x`, que el propio plugin lista como alternativa.

### D6. Verificación de tipos: `astro check`

- **Decisión**: `@astrojs/check` + `typescript`. Script `check` = `astro check` (cubre `.astro` y `.ts`).

### D7. Lighthouse en CI: Lighthouse CI (`@lhci/cli`), informativo

- **Decisión**: `@lhci/cli` (0.15.1) ejecutado en un job aparte, **no requerido**, sobre `astro preview` (que corre en `workerd`, como producción). Emulación móvil (la predeterminada), 3 corridas. Aserciones de rendimiento y accesibilidad ≥0.90 en nivel `warn`. El reporte se guarda con `upload.target: filesystem` y se sube como artefacto de GitHub Actions.
- **Razón**: la spec (SC-001) pide una auditoría automática en cada PR, solo informativa. Se evita `temporary-public-storage` porque publica los reportes en un servicio de terceros. Chrome ya viene en `ubuntu-latest`.
- **Nota**: el job usa `continue-on-error: true` y no se agrega a las comprobaciones obligatorias. El umbral ≥90 sigue siendo la meta de la constitución; que no bloquee es decisión de la spec.
- **Alternativas**: `lighthouse` directo (más guion propio para el mismo resultado); PageSpeed Insights API (necesita URL pública y clave).

### D8. Adaptador de Cloudflare: configuración mínima (sin KV, sin Images)

- **Decisión**: `@astrojs/cloudflare@^14` con `session: false` e `imageService: 'compile'`.
- **Razón**: según la documentación del adaptador, por defecto Astro provisiona un KV para sesiones y un binding de Cloudflare Images al desplegar. Esta funcionalidad no tiene sesiones ni almacenamiento (FR-014) y la documentación no aclara el costo del binding de Images. Con `session: false` no se crea KV y con `compile` el logo se procesa en el build.
- **Wrangler**: `wrangler.jsonc` con `name`, `compatibility_date`, `compatibility_flags` (`nodejs_compat`, `global_fetch_strictly_public`, según la guía de Astro) y `observability.enabled: true`. Sin bindings.

### D9. La página de inicio se renderiza en el servidor (SSR)

- **Decisión**: `export const prerender = false` en `index.astro`.
- **Razón**: el ADR 0002 dice que la capacidad de CPU "se mide en el Hito 1 con el esqueleto desplegado". Una página prerenderizada se sirve como static asset, que no ejecuta el Worker y no consume CPU; no habría nada que medir. Con SSR la línea base (HTML sin lógica) es la del Worker real. El costo es que cada visita cuenta contra los 100.000 requests/día, lo cual es irrelevante a este tráfico.
- **Alternativa**: prerenderizar la página y medir una ruta SSR auxiliar. Se descarta por agregar una ruta que no es parte de la spec.
- **Pendiente de verificar al implementar**: que la ruta inexistente devuelva `404.astro` con estado 404 desde el Worker (con SSR el enrutador de Astro la atiende; `not_found_handling` aplica solo a static assets).

### D10. Logo

- **Decisión**: usar `docs/design/SamuelE.jpg` copiado a `src/assets/`, procesado con `astro:assets` (`<Image>`, WebP, ancho/alto explícitos para evitar saltos de diseño), recortado en círculo con CSS como en los mockups.
- **Razón**: el original (720×533) trae metadatos EXIF de un celular Android (modelo de software, fecha). `sharp` elimina los metadatos al reencodear, lo que cumple el principio III también para el logo. Verificar el resultado con `exiftool` o equivalente.

### D11. Despliegue: `cloudflare/wrangler-action@v4`

- **Decisión**: acción oficial `cloudflare/wrangler-action@v4`, que ejecuta `wrangler deploy` tras el build. Dos secretos de GitHub: `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` (pasos en `quickstart.md`).
- **Razón**: es lo que el ADR 0002 indica y la guía oficial de Cloudflare. El token usa la plantilla "Edit Cloudflare Workers", limitado a la cuenta.
- **Orden de publicaciones**: `concurrency` con grupo fijo y `cancel-in-progress: false`. GitHub conserva solo la ejecución pendiente más reciente, así que con dos fusiones seguidas la última publicación corresponde al cambio más nuevo sin interrumpir una publicación en curso.
- **Prerrequisito de una sola vez**: el subdominio `workers.dev` de la cuenta debe existir. Verificar si el primer `wrangler deploy` no interactivo lo crea; si no, registrarlo en el panel de Cloudflare.

### D12. Reversión de un despliegue fallido

- **Si falla la publicación**: `wrangler deploy` sube y activa una versión de forma atómica. Si falla el build, las pruebas o el propio deploy, la versión anterior sigue sirviendo (FR-009, SC-007). El fallo queda como ejecución en rojo en la pestaña Actions; GitHub envía además el correo estándar de fallo a quien hizo la fusión (no es notificación configurada por el proyecto).
- **Si se publicó algo malo**: `npx wrangler rollback` (o el botón de rollback del panel de Cloudflare) devuelve el 100 % del tráfico a la versión estable anterior de inmediato. Después, un PR de reversión (`git revert`) deja `main` alineado con producción; sin ese PR la siguiente fusión volvería a publicar el cambio malo.
- **Reintento por fallo externo**: "Re-run jobs" en Actions y `workflow_dispatch` en ambos flujos, sin crear un cambio nuevo.

### D13. Medir el consumo real de CPU

- **Decisión**: con `observability.enabled` activo, tras el primer despliegue se generan unas 50–100 visitas a la página (`curl` en bucle) y se lee la gráfica "CPU time per execution" del panel de Cloudflare (Workers → el Worker → Metrics), que muestra percentiles P50, P90, P99 y P999. Alternativa reproducible: la API GraphQL de analítica de Workers.
- **Criterio propuesto** (ajustable): P99 ≤ 10 ms (límite del plan gratuito) y P50 ≤ 3 ms. El resultado se anota en el PR y, si hay riesgo, en una actualización del ADR 0002.
- **A confirmar al implementar**: la documentación consultada no dice si la gráfica de CPU está disponible en el plan gratuito. Si no lo está, usar la API GraphQL o `wrangler tail`.

### D14. Protección de `main` (resuelto)

- **Hecho**: el repositorio `Juan-Diego22/SamuelE` era privado y el plan gratuito de GitHub no ofrece rulesets ni protección de ramas, lo que impedía cumplir FR-007 y SC-006 (y contradecía el ADR 0001).
- **Decisión del usuario (2026-10-08)**: opción A, hacer el repositorio **público**. Antes se revisó que no hubiera secretos en archivos ni en el historial (ninguno); quedan visibles el código, los ADR, los mockups (con teléfono ficticio) y el correo de autor de los commits.
- **Aplicado**: ruleset `protect-main` (id 24756386) con PR obligatorio, solo squash, sin borrado ni push forzado y **sin actores con bypass**. Se activó también "borrar rama al fusionar" y se desactivaron merge commit y rebase.
- **Pendiente**: agregar la regla de "status checks obligatorios" con el check de `ci.yml` cuando exista; antes de eso bloquearía toda fusión.
- **Descartadas**: GitHub Pro (rompe el principio I) y disciplina manual (no cumple SC-006).

## Resumen de versiones (npm, 2026-10-08)

| Paquete | Versión usada |
|---|---|
| astro | ^7.3 |
| @astrojs/cloudflare | ^14.3 |
| wrangler | ^4.149 |
| typescript | ~6.0.3 |
| @astrojs/check | ^0.9 |
| vitest | ^5.0 |
| eslint | ^10.12 |
| typescript-eslint | ^8.71 |
| eslint-plugin-astro | ^3.2 |
| prettier / prettier-plugin-astro | ^3.9 / ^1.1 |
| @fontsource/dancing-script | ^5.3 |
| @lhci/cli | ^0.15 |
| sharp | la que pida Astro 7 |

> Las versiones se fijan al ejecutar `npm install`; el `package-lock.json` es la fuente de verdad.
