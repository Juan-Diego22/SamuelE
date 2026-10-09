# Tasks: Esqueleto desplegado de punta a punta

**Input**: Documentos de diseño en `/specs/001-project-skeleton/` (plan.md, spec.md, research.md, quickstart.md)

**Prerequisites**: plan.md, spec.md. No hay data-model.md ni contracts/ (sin datos ni API).

**Tests**: FR-010 pide pruebas del contenido esencial de la página de inicio; el plan agrega una del 404. Solo se generan esas dos.

**Organization**: Tareas agrupadas por historia de usuario. Proyecto único de Astro en la raíz del repositorio. Idioma de documentación, comentarios e interfaz: español; identificadores en inglés.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario a la que pertenece (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar el proyecto Astro con sus herramientas.

- [X] T001 Crear `.nvmrc` con el contenido `22` en `.nvmrc`
- [X] T002 Crear `package.json` en `package.json` con `"type": "module"`, `engines.node` `>=22.12.0` y scripts `dev`, `build`, `preview`, `check` (`astro check`), `lint` (`eslint .`), `format:check` (`prettier --check .`), `test` (`vitest run`); instalar con npm: `astro@^7.3`, `@astrojs/cloudflare@^14.3`, `wrangler@^4.149`, `@fontsource/dancing-script@^5.3`, `sharp`, y como devDependencies `typescript@~6.0.3`, `@astrojs/check@^0.9`, `vitest@^5`, `eslint@^10.12`, `typescript-eslint@^8.71`, `eslint-plugin-astro@^3.2`, `prettier@^3.9`, `prettier-plugin-astro@^1.1`, `@lhci/cli@^0.15`; generar `package-lock.json`. Si `eslint-plugin-jsx-a11y` no declara compatibilidad con ESLint 10, usar `eslint-plugin-jsx-a11y-x` (R2 de research.md)
- [X] T003 [P] Crear `tsconfig.json` en `tsconfig.json` extendiendo `astro/tsconfigs/strict` e incluyendo `.astro/types.d.ts` y `src/**/*`, `tests/**/*`
- [X] T004 [P] Crear `.prettierrc` en `.prettierrc` con el plugin `prettier-plugin-astro` y override `parser: astro` para `*.astro`; crear `.prettierignore` en `.prettierignore` con `dist/`, `.astro/`, `.wrangler/`, `package-lock.json`, `specs/`, `docs/`, `.specify/`, `.claude/`
- [X] T005 [P] Crear `eslint.config.js` en `eslint.config.js` con `typescript-eslint` recomendado, `eslint-plugin-astro` (configuración `recommended` y `jsx-a11y-recommended`) e ignorando `dist/`, `.astro/`, `.wrangler/`
- [X] T006 [P] Actualizar `.gitignore` en `.gitignore` agregando `node_modules/`, `dist/`, `.astro/`, `.wrangler/`, `.dev.vars`, `lhci-reports/` (conservar las líneas existentes)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configuración de Astro/Cloudflare, Vitest y activos base que necesitan todas las historias.

**⚠️ CRITICAL**: Ninguna historia puede comenzar hasta terminar esta fase.

- [X] T007 Crear `astro.config.mjs` en `astro.config.mjs` con `defineConfig`, `adapter: cloudflare({ imageService: 'compile' })` y `session: false` (D8: sin KV ni Images)
- [X] T008 [P] Crear `wrangler.jsonc` en `wrangler.jsonc` con `name` (p. ej. `samuele-reposteria`), `main` y `assets` según la guía del adaptador de Astro 7, `compatibility_date` de hoy (los valores exactos de `main` y `assets` se toman de la documentación del adaptador al instalarlo, y se registran en `research.md` D8 si difieren de lo previsto), `compatibility_flags` `["nodejs_compat", "global_fetch_strictly_public"]` y `observability.enabled: true`; sin ningún binding (FR-014). Sin secretos ni IDs de cuenta (FR-013)
- [X] T009 [P] Crear `vitest.config.ts` en `vitest.config.ts` usando `getViteConfig` de `astro/config`, entorno `node`, `include: ['tests/**/*.test.ts']`. Si el plugin del adaptador de Cloudflare estorba en Vitest (R1), construir la configuración de Astro sin el adaptador
- [X] T010 [P] Copiar `docs/design/SamuelE.jpg` a `src/assets/logo-samuele.jpg` (el original se conserva en `docs/design/`)
- [X] T011 Crear `src/env.d.ts` en `src/env.d.ts` con la referencia `/// <reference path="../.astro/types.d.ts" />`

**Checkpoint**: `npm run check` y `npm run build` funcionan sobre un proyecto vacío de páginas.

---

## Phase 3: User Story 1 - Ver la página de inicio con la identidad del negocio (Priority: P1) 🎯 MVP

**Goal**: Página de inicio pública con logo, nombre "Samuelé Repostería", lema "Creamos momentos dulces" y mensaje de catálogo próximo, con la identidad visual de `docs/design/mockups.md`, y página 404 amable.

**Independent Test**: `npm run build && npm run preview`, abrir en celular real: se ven logo, nombre, lema y mensaje sin desplazamiento horizontal desde 320 px; `/xyz` muestra el 404 con enlace al inicio. `npm test` pasa.

### Tests for User Story 1 ⚠️

> Escribir primero y comprobar que FALLAN antes de implementar.

- [X] T012 [P] [US1] Crear `tests/home.test.ts` en `tests/home.test.ts`: con `experimental_AstroContainer` renderizar `src/pages/index.astro` a HTML y verificar que contiene "Samuelé Repostería", "Creamos momentos dulces", un mensaje con "catálogo" y "pronto", `<html lang="es">`, `<meta name="viewport"` y que la `<img>` del logo tiene `alt` no vacío (FR-001, FR-005, FR-010)
- [X] T013 [P] [US1] Crear `tests/not-found.test.ts` en `tests/not-found.test.ts`: renderizar `src/pages/404.astro` y verificar el mensaje amable, el logo con `alt` y un enlace `<a href="/">` al inicio

### Implementation for User Story 1

- [X] T014 [P] [US1] Crear `src/styles/global.css` en `src/styles/global.css`: variables CSS `--chocolate: #3B1F14`, `--rosa: #E85A9A`, `--rosa-oscuro: #B8326E`, `--rojo: #A8142F`, `--dorado: #C9A24B`, `--crema: #FFF8F1`; fondo crema, texto chocolate (contraste ≥4.5:1, FR-004); `font-family` del cuerpo `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` con `font-size: 1rem` mínimo 16 px; títulos con `'Dancing Script', 'Brush Script MT', cursive`; móvil primero con `box-sizing: border-box`, `max-width: 100%` en imágenes y sin `overflow-x` horizontal desde 320 px; mejora progresiva: valores de respaldo antes de `clamp()`/`min()` y sin depender de `gap` ni `grid` para el contenido esencial (FR-003a)
- [X] T015 [P] [US1] Crear `src/components/BrandHeader.astro` en `src/components/BrandHeader.astro`: logo importado de `../assets/logo-samuele.jpg` con `<Image>` de `astro:assets` (formato `webp`, `width` y `height` explícitos, `alt="Logo de Samuelé Repostería"`), recortado en círculo con CSS (`border-radius: 50%`, `object-fit: cover`), seguido del nombre "Samuelé Repostería" en `<h1>` con fuente script y el lema "Creamos momentos dulces". El nombre debe seguir visible si el logo no carga
- [X] T016 [US1] Crear `src/layouts/BaseLayout.astro` en `src/layouts/BaseLayout.astro`: `<html lang="es">`, `<meta charset>`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, prop `title`, importa `@fontsource/dancing-script/latin-400.css` (autoalojada, ADR 0007) y `../styles/global.css`, con `<slot />` dentro de `<main>`
- [X] T017 [US1] Crear `src/pages/index.astro` en `src/pages/index.astro` con `export const prerender = false` (D9), usando `BaseLayout` (título "Samuelé Repostería"), `BrandHeader` y un párrafo "Nuestro catálogo estará disponible muy pronto". Sin botón de contacto, WhatsApp ni otros datos (FR-014). Depende de T015 y T016
- [X] T018 [US1] Crear `src/pages/404.astro` en `src/pages/404.astro`: `BaseLayout`, logo (reutilizar `BrandHeader` o variante), mensaje amable ("No encontramos esta página") y enlace `<a href="/">Volver al inicio</a>`. Depende de T015 y T016
- [X] T019 [US1] Verificar en local: `npm run build && npm run preview`; confirmar que `/` responde 200 con el contenido esperado, que `/xyz` responde **404** con `404.astro` desde el Worker (pendiente de D9) y que `npm test` pasa. Si `/xyz` no devuelve la página 404, ajustar según el adaptador y anotarlo en `research.md` (D9)
- [X] T020 [US1] Verificar el logo procesado: comprobar con `exiftool` (o equivalente) que el WebP generado en `dist/` no contiene metadatos EXIF (D10, Principio III). Si `exiftool` no está, usar `sharp(...).metadata()` desde un script de una línea

**Checkpoint**: La historia 1 funciona y se prueba por sí sola, localmente.

---

## Phase 4: User Story 2 - Validación automática de cada propuesta de cambio (Priority: P2)

**Goal**: Cada PR ejecuta tipos, estilo, pruebas y build; Lighthouse corre como informativo; la fusión se bloquea si falla.

**Independent Test**: Abrir un PR correcto (CI verde, fusionable) y otro con un error de tipos/estilo/prueba (CI rojo, fusión bloqueada).

### Implementation for User Story 2

- [X] T021 [P] [US2] Crear `lighthouserc.json` en `lighthouserc.json`: `ci.collect` con `startServerCommand` `npm run preview`, `url` `http://localhost:4321/`, `numberOfRuns: 3`, emulación móvil (predeterminada); `ci.assert.assertions` con `categories:performance` y `categories:accessibility` en `["warn", {"minScore": 0.9}]`; `ci.upload.target` `filesystem` con `outputDir` `lhci-reports` (D7, SC-001)
- [X] T022 [US2] Crear `.github/workflows/ci.yml` en `.github/workflows/ci.yml`: disparadores `pull_request`, `workflow_call` y `workflow_dispatch` (reintento sin crear un cambio nuevo, D12); `permissions: contents: read`; job `validate` con `actions/checkout`, `actions/setup-node` (`node-version-file: .nvmrc`, `cache: npm`), `npm ci`, y los pasos `npm run check`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`; job aparte `lighthouse` con `if: github.event_name == 'pull_request'`, `continue-on-error: true`, `npm ci`, `npm run build`, `npx lhci autorun` y `actions/upload-artifact` de `lhci-reports/`. Sin secretos
- [X] T023 [P] [US2] Crear `.github/pull_request_template.md` en `.github/pull_request_template.md` con secciones de resumen, ADR relacionado, y casilla obligatoria "Probado en celular real: modelo ____, navegador ____, fecha ____" (SC-004, definición de terminado) y casilla "Lighthouse revisado: rendimiento ≥90 y accesibilidad ≥90, o motivo de la excepción" (Principio II; el job es informativo y no bloquea)
- [ ] T024 [US2] Abrir el PR de esta rama contra `main` (el PR incluirá `ci.yml` y también `deploy.yml` de T026; ver el orden en Dependencies) y comprobar que `ci` y `lighthouse` se ejecutan; anotar el nombre exacto del check (p. ej. `validate`) para T025. Probar también un PR descartable con una prueba rota y confirmar que `ci` queda en rojo (SC-006)
- [ ] T025 [US2] Agregar la regla de "status checks obligatorios" al ruleset `protect-main` (id 24756386) con el check de `ci.yml` identificado en T024, con `gh api` o desde Settings → Rules, manteniendo sin actores con bypass (FR-007, D14). Verificar con un PR en rojo que la fusión queda bloqueada y que un `git push` directo a `main` es rechazado (US2 escenario 4). Depende de T024

**Checkpoint**: Las historias 1 y 2 funcionan; `main` exige CI verde.

---

## Phase 5: User Story 3 - Publicación automática al fusionar (Priority: P2)

**Goal**: Al fusionar en `main`, el sitio se publica solo en `workers.dev`; si falla, el sitio anterior sigue sirviendo y el fallo queda visible.

**Independent Test**: Fusionar un cambio visible y verlo en la URL pública en ≤10 minutos sin pasos manuales; forzar una publicación fallida y comprobar que el sitio anterior responde y la ejecución queda en rojo.

### Implementation for User Story 3

- [X] T026 [US3] Crear `.github/workflows/deploy.yml` en `.github/workflows/deploy.yml`: disparadores `push` a `main` y `workflow_dispatch`; `concurrency: { group: deploy, cancel-in-progress: false }`; job `validate` que usa `./.github/workflows/ci.yml` (`workflow_call`); job `deploy` con `needs: validate`, `permissions: contents: read`, `checkout`, `setup-node` (`.nvmrc`, cache npm), `npm ci`, `npm run build` y `cloudflare/wrangler-action@v4` con `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}`, `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` y `command: deploy` (D11). Ningún secreto escrito en el archivo (FR-013). En `ci.yml`, el job `lighthouse` ya está condicionado a `pull_request`, así que no corre aquí
- [ ] T027 [US3] **Acción manual de la persona administradora (una sola vez, ANTES de fusionar el PR, porque la fusión dispara el primer deploy)**: seguir `quickstart.md` §2: registrar el subdominio `workers.dev` en Cloudflare, crear el API token "Edit Cloudflare Workers" y guardar `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en GitHub → Settings → Secrets and variables → Actions. No pegar los valores en el repositorio ni en el chat
- [ ] T028 [US3] Tras fusionar el PR (squash; requiere T025 y T027 hechos), observar `deploy` en Actions: verificar que el sitio responde en `https://<worker>.<subdominio>.workers.dev`, que el tiempo total es ≤10 minutos (SC-005) y registrar la URL y la duración en el PR. Si el primer `wrangler deploy` no crea el subdominio, registrarlo en el panel (D11). Opcional: hacer dos fusiones seguidas de cambios triviales y comprobar que la publicación final corresponde a la más reciente (`concurrency`); si no se prueba, anotarlo como aceptado sin prueba
- [ ] T029 [US3] Verificar la falla segura (FR-009, SC-007) con este procedimiento: (1) con el sitio ya publicado por T028, cambiar el valor del secreto `CLOUDFLARE_API_TOKEN` en GitHub a un valor inválido; (2) ejecutar `deploy` con "Run workflow" (`workflow_dispatch`) sobre `main`; (3) confirmar que la ejecución queda roja con su registro y que la URL pública sigue sirviendo la versión anterior; (4) **restaurar inmediatamente** el token válido (T027) y re-ejecutar `deploy` hasta que quede verde
- [ ] T030 [US3] Medir el CPU del Worker (D13, `quickstart.md` §6): ejecutar `for i in $(seq 1 100); do curl -s -o /dev/null https://<worker>.<subdominio>.workers.dev/; done`, leer "CPU time per execution" en Cloudflare (o la API GraphQL / `wrangler tail` si la gráfica no está en el plan gratuito). Criterio: P99 ≤ 10 ms y P50 ≤ 3 ms. Anotar valores y fecha en el PR; si P99 se acerca a 10 ms, actualizar `docs/adr/0002-stack-tecnologico.md`

**Checkpoint**: Recorrido completo repositorio → internet, validado y automático.

---

## Phase 6: User Story 4 - Documentación para un desarrollador nuevo (Priority: P3)

**Goal**: Con solo el README, una persona nueva levanta el proyecto, corre las pruebas y entiende la publicación.

**Independent Test**: Seguir únicamente el README en una máquina limpia: ver la página en local, correr las pruebas y explicar el flujo de publicación en menos de 30 minutos (SC-008).

### Implementation for User Story 4

- [X] T031 [P] [US4] Crear `README.md` en `README.md` (en español) con: descripción del proyecto; requisitos previos (Node 22 vía `nvm use`, npm); levantar en local (`npm ci`, `npm run dev`, `npm run build && npm run preview`); ejecutar `npm run check`, `npm run lint`, `npm run format:check`, `npm test`; estructura del proyecto (`src/layouts`, `src/components`, `src/pages`, `src/styles`, `tests/`, `.github/workflows/`); cómo se valida un PR (`ci.yml`, Lighthouse informativo, prueba en celular real en la plantilla del PR); cómo se publica al fusionar (`deploy.yml`, secretos requeridos, sin vista previa por PR); qué hacer si falla (re-ejecutar, `wrangler rollback`, PR de reversión con `git revert`); enlaces a `docs/adr/` y `specs/001-project-skeleton/quickstart.md` (FR-011, D12)
- [X] T032 [P] [US4] Crear el ADR `docs/adr/0008-herramientas-de-desarrollo.md` en `docs/adr/0008-herramientas-de-desarrollo.md` siguiendo el formato de los ADR 0002–0007 existentes (leer uno antes): registra npm (D1), Node 22 LTS y su fin de soporte en abril de 2027 (D2), TypeScript 6.0.x y por qué no 7 (D3), Vitest con la API de contenedor (D4), ESLint + Prettier (D5), `astro check` (D6), Lighthouse CI informativo (D7), costo $0 de cada herramienta (Principio I). Referenciarlo desde `README.md`
- [ ] T033 [US4] Validar el README: ejecutar tal cual sus pasos en un directorio limpio (`git clone` en una carpeta temporal) y corregir cualquier paso que falle o falte. Depende de T031

**Checkpoint**: Las cuatro historias están completas.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificaciones finales de criterios transversales.

- [ ] T034 Probar la página en un celular real (`npm run dev -- --host`, `http://<IP>:4321`) a 320 px de ancho efectivo y en horizontal; confirmar ausencia de desplazamiento horizontal (SC-003) y completar la casilla del PR con modelo, navegador y fecha (SC-004). Requiere a la persona desarrolladora
- [ ] T035 [P] Verificar contraste ≥4.5:1 y `alt` del logo con Lighthouse/axe sobre `/` y `/xyz` (SC-002) y revisar el reporte de Lighthouse (SC-001: rendimiento ≥90 y accesibilidad ≥90); registrar resultados en el PR
- [ ] T036 [P] Verificar el degradado en navegadores antiguos (FR-003a): desactivar CSS moderno en las DevTools o revisar con un navegador antiguo disponible y confirmar que logo, nombre, lema y mensaje siguen legibles; y simular que la fuente script no carga (US1 escenario 5) comprobando que se usa la de respaldo sin romper el diseño
- [ ] T037 Revisión de alcance y secretos (Principio III, IV, FR-013, FR-014): `git grep -n -i -E "token|secret|api[_-]?key"` sobre archivos versionados sin hallazgos reales y confirmar que `wrangler.jsonc` no tiene bindings
- [ ] T038 Ejecutar la validación completa de `quickstart.md` (§1, §3, §4) y marcar discrepancias; corregir `quickstart.md` si algún comando cambió

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational. Es el MVP.
- **US2 (Phase 4)**: depende de Foundational; para que `ci` pase realmente necesita el contenido de US1 (pruebas y build). En la práctica, ejecutar después de US1.
- **US3 (Phase 5)**: depende de US2 (`deploy.yml` llama a `ci.yml`) y de T027 (secretos).
- **Orden hasta la primera fusión**: T022 y T026 (ambos workflows) → T024 (abrir el PR) → T025 (check obligatorio) → T027 (secretos) → fusionar → T028. T029 y T030 después de T028.
- **US4 (Phase 6)**: el README describe lo construido; escribir tras US2 y US3.
- **Polish (Phase 7)**: depende de las historias deseadas.

### Within Each Story

- Pruebas primero (deben fallar), luego componentes y estilos, luego páginas, luego verificación.
- T015 y T016 antes de T017 y T018.
- T024 antes de T025.

### Parallel Opportunities

- Setup: T003, T004, T005, T006 en paralelo tras T002.
- Foundational: T008, T009, T010 en paralelo tras T007.
- US1: T012, T013, T014, T015 en paralelo; luego T016; luego T017 y T018 en paralelo.
- US2: T021 y T023 en paralelo (T022 en paralelo con ellos si no se toca el mismo archivo).
- US4: T031 y T032 en paralelo.
- Polish: T035 y T036 en paralelo.

---

## Parallel Example: User Story 1

```bash
# Pruebas y piezas independientes juntas:
Task: "Crear tests/home.test.ts"
Task: "Crear tests/not-found.test.ts"
Task: "Crear src/styles/global.css"
Task: "Crear src/components/BrandHeader.astro"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Fase 1: Setup. 2. Fase 2: Foundational. 3. Fase 3: US1.
4. **Detenerse y validar** en local y en celular real.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → página visible en local (MVP).
3. US2 → `main` protegido con CI obligatorio.
4. US3 → primera publicación en `workers.dev`, medición de CPU.
5. US4 → README y ADR 0008.
6. Polish → verificación en celular real y criterios transversales.

### Notes

- T027, T029 y T034 requieren acciones de la persona administradora (cuenta de Cloudflare, secretos, celular real); no se pueden completar solo con código.
- Commits en inglés con Conventional Commits y `Refs: HU-14`; ramas con prefijo `feature/`; fusión con squash.
- Cada historia debe poder validarse por sí sola antes de pasar a la siguiente.
