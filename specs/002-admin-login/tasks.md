---

description: "Lista de tareas para la funcionalidad 002: inicio de sesión de la administradora"
---

# Tasks: Inicio de sesión de la administradora

**Input**: Documentos de diseño en `/specs/002-admin-login/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-routes.md, quickstart.md

**Tests**: INCLUIDAS. FR-020 y la constitución (principio V) las exigen para autenticación. Dentro de cada historia se escriben primero y deben fallar antes de implementar.

**Organization**: Tareas agrupadas por historia de usuario (US1 a US4) para implementarlas y probarlas de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1, US2, US3, US4)
- Todas las rutas son relativas a la raíz del repositorio

## Path Conventions

Proyecto único de Astro (ver plan.md, "Decisión de estructura"): lógica en `src/lib/auth/` sin importar `cloudflare:workers` (recibe `db` y `env` por parámetro); solo `src/middleware.ts` y las páginas leen el entorno del Worker. Pruebas en `tests/auth/`. Código e identificadores en inglés; comentarios, textos de interfaz y documentación en español.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencias, configuración de D1 y secretos

- [X] T001 Añadir `drizzle-orm` (dependencies) y `drizzle-kit` (devDependencies) en `package.json` y ejecutar `npm install` para actualizar `package-lock.json`
- [X] T002 [P] Crear `drizzle.config.ts` en la raíz (dialecto `sqlite`, `schema: "./src/db/schema.ts"`, `out: "./migrations"`)
- [X] T003 [P] Añadir a `wrangler.jsonc` el binding `d1_databases: [{ "binding": "DB", "database_name": "samuele-reposteria", "database_id": "<id>", "migrations_dir": "migrations" }]`; usar `local-placeholder` como `database_id` hasta crear la base real (quickstart §5.1) y dejar un comentario que lo explique
- [X] T004 [P] Crear `.dev.vars.example` con `ADMIN_EMAIL=admin@example.com` y `ADMIN_PASSWORD=cambia-esta-contrasena-por-una-aleatoria-de-20-o-mas-caracteres`, y confirmar que `.dev.vars` está en `.gitignore` (añadirlo si falta)
- [X] T005 Tipar el entorno en `src/env.d.ts`: declarar `Cloudflare.Env` con `DB: D1Database`, `ADMIN_EMAIL?: string`, `ADMIN_PASSWORD?: string` y `App.Locals` con `session?: { id: string }`; verificar la forma exacta de leer `env` con `import { env } from "cloudflare:workers"` en `@astrojs/cloudflare` 14.3 (research D2, verificación pendiente) y anotar el resultado en un comentario

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: esquema, almacén de datos, criptografía y sesiones que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [X] T006 Definir en `src/db/schema.ts` (Drizzle, `sqliteTable`) las tablas: `sessions` con `id` TEXT clave primaria ("SHA-256 del token, en hexadecimal (64 caracteres). Nunca el token original"), `created_at` INTEGER no nulo y `expires_at` INTEGER no nulo (milisegundos Unix UTC) más el índice `sessions_expires_at_idx` sobre `expires_at`; y `login_attempts` con `id` INTEGER clave primaria autoincremental y `attempted_at` INTEGER no nulo más el índice `login_attempts_attempted_at_idx`. Sin columnas de persona ni IP (data-model.md)
- [X] T007 Generar la migración con `npx drizzle-kit generate --name sessions_and_login_attempts` y dejarla como `migrations/0000_sessions_and_login_attempts.sql`; comprobar que contiene las dos tablas y los dos índices y aplicarla en local con `npx wrangler d1 migrations apply DB --local` (depende de T003, T006)
- [X] T008 [P] Implementar `src/lib/auth/crypto.ts`: `sha256Hex(input: string)`, `sha256Bytes(input: string)`, `generateToken()` (32 bytes de `crypto.getRandomValues` en base64url) y `timingSafeEqualBytes(a, b)` sobre `crypto.subtle.timingSafeEqual` (con respaldo en Node para Vitest, comparando sin cortocircuito)
- [X] T009 [P] Escribir `tests/auth/crypto.test.ts`: SHA-256 conocido ("abc"), token de 43 caracteres base64url distinto en cada llamada, comparación en tiempo constante verdadera/falsa (depende de T008; debe fallar antes de T008)
- [X] T010 Definir en `src/lib/auth/store.ts` la interfaz `AuthStore` (`insertSession(id, createdAt, expiresAt)`, `findSession(id)`, `deleteSession(id)`, `deleteExpiredSessions(now)`, `recentFailures(limit)` devolviendo `attempted_at` descendentes, `insertFailure(at)`, `deleteFailuresBefore(cutoff)`, `deleteAllFailures()`) y su implementación `createD1Store(db)` con Drizzle; agrupar con `db.batch` las operaciones de limpieza y escritura de un mismo intento (research D6, D7); incluir además `createMemoryStore()` en memoria para pruebas (depende de T006)
- [X] T011 Implementar `src/lib/auth/sessions.ts`: constantes `SESSION_TTL_MS = 2_592_000_000`, `createSession(store, now)` → `{ token, expiresAt }` guardando solo `sha256Hex(token)`; `validateSession(store, token, now)` → `{ id } | null` (válida solo si `expires_at > now`; un error del almacén devuelve `null`, falla cerrada); `deleteSession(store, token)`; `cleanupExpired(store, now)` (depende de T008, T010)
- [X] T012 [P] Implementar `src/lib/auth/origin.ts`: `isSafeMethod(method)` (GET, HEAD, OPTIONS) e `isSameOrigin(request, siteOrigin)`: `false` si falta `Origin` o no coincide exactamente con el origen del sitio (FR-012)
- [X] T013 [P] Escribir `tests/auth/origin.test.ts`: métodos seguros pasan; POST sin `Origin` → rechazado; POST con `Origin` ajeno → rechazado; POST con `Origin` propio → permitido (debe fallar antes de T012)

**Checkpoint**: base lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Entrar al panel con correo y contraseña (Priority: P1) 🎯 MVP

**Goal**: la administradora entra con correo y contraseña desde `/admin/login` y llega al panel; con datos incorrectos ve el mismo mensaje genérico.

**Independent Test**: abrir `/admin/login`, entrar con credenciales correctas y llegar a `/admin`; repetir con correo incorrecto y con contraseña incorrecta y comprobar que la pantalla es idéntica (quickstart §3, pasos 3 a 5).

### Tests for User Story 1 ⚠️ (escribir primero, deben fallar)

- [X] T014 [P] [US1] Escribir `tests/auth/credentials.test.ts`: correo con mayúsculas y espacios se normaliza y acepta (`trim` + minúsculas, también en `ADMIN_EMAIL`); correo mal → rechazado; contraseña mal → rechazada; falta `ADMIN_EMAIL` o `ADMIN_PASSWORD` → siempre rechazado; la contraseña no se normaliza (FR-002, research D5)
- [X] T015 [P] [US1] Escribir `tests/auth/login.test.ts` (almacén en memoria y reloj inyectado): credenciales correctas → `{ status: "ok", token }` con una sesión creada; correo mal y contraseña mal → resultado `{ status: "invalid" }` idéntico (`toEqual`); campos vacíos → `{ status: "empty" }` sin consultar credenciales ni registrar fallo; almacén que lanza error → `{ status: "unavailable" }` sin conceder acceso; sin secretos → `invalid` (falla cerrada) y aviso por el registrador inyectado
- [X] T016 [P] [US1] Escribir `tests/auth/login-page.test.ts` con `AstroContainer`: el GET renderiza logo, título "Panel de trabajos", etiquetas asociadas a `email` y `password`, botón "Ingresar", `autocomplete="username"` y `"current-password"`, `required`; el HTML del error de correo mal y de contraseña mal es idéntico y contiene `role="alert"` con "Correo o contraseña incorrectos." enlazado por `aria-describedby`; campos vacíos muestran "Completa tu correo y tu contraseña."; estado 503 con "No pudimos iniciar sesión, intenta de nuevo en unos minutos"

### Implementation for User Story 1

- [X] T017 [US1] Implementar `src/lib/auth/credentials.ts`: `normalizeEmail(value)` y `verifyCredentials(env, email, password)`; calcular SHA-256 de ambos correos y ambas contraseñas, comparar **ambas** parejas con `timingSafeEqualBytes` sin cortocircuito y combinar al final; devolver `false` si falta cualquier secreto (research D5; depende de T008)
- [X] T018 [US1] Implementar `src/lib/auth/login.ts`: `attemptLogin({ store, env, email, password, now, log })` que orquesta vacíos → credenciales → creación de sesión (y registro de fallo en el almacén al rechazar, vía `store.insertFailure`) y devuelve `empty | invalid | unavailable | ok`; cualquier excepción del almacén produce `unavailable`; emite aviso con `log` si faltan secretos (depende de T011, T017)
- [X] T019 [US1] Crear `src/pages/admin/login.astro` reutilizando `BaseLayout` y `BrandHeader` (logo grande recortado en círculo, `src/assets/logo-samuele.jpg`): GET muestra el formulario; POST (`application/x-www-form-urlencoded`) llama a `attemptLogin` con `env` de `cloudflare:workers`; éxito → `Set-Cookie` y 303 a `/admin`; vacío y credenciales incorrectas → 200 con el mismo formulario y mensaje; base caída → 503. Cookie: `__Host-session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000` (`session` sin `Secure` cuando `!import.meta.env.PROD`, research D4). Campos `type="email"`/`type="password"`, `<p role="alert">` con `aria-describedby`
- [X] T020 [US1] Añadir en `src/styles/global.css` los estilos del formulario: campos y botón con `min-height: 48px`, contraste ≥4.5:1 con la paleta existente, sin desplazamiento horizontal desde 320 px, foco visible para teclado, mensaje de error legible (FR-015)
- [X] T021 [US1] Añadir en `login.astro` el script mínimo que deshabilita el botón "Ingresar" al enviar (mejora progresiva: sin JavaScript el formulario sigue funcionando, FR-016, research D8)
- [X] T022 [US1] Crear `src/pages/admin/index.astro`: marcador con título "Panel de trabajos" y formulario `method="post" action="/api/admin/logout"` con el botón "Salir" (FR-014; el botón se activa en US3)

**Checkpoint**: US1 funcional y probada de forma independiente (acceso directo a `/admin` todavía sin protección: llega con US2)

---

## Phase 4: User Story 2 - Que nadie sin sesión llegue al panel (Priority: P1)

**Goal**: toda dirección bajo `/admin` (existente o no) redirige a `/admin/login` sin sesión; toda ruta bajo `/api/admin` responde 401; peticiones que modifican datos desde otro origen se rechazan; el sitio público no cambia.

**Independent Test**: sin sesión, abrir `/admin` y `/admin/cualquier-cosa` (redirigen) y pedir `/api/admin/logout` (401); con sesión, `/admin/login` lleva a `/admin` (quickstart §3, pasos 1, 2, 7 y 11).

### Tests for User Story 2 ⚠️

- [X] T023 [P] [US2] Escribir `tests/auth/middleware.test.ts` con contexto simulado y almacén en memoria, una prueba por cada fila del contrato: ruta pública pasa sin cambios y sin cabeceras añadidas; `POST` con `Origin` falta/ajeno → 403 (incluido `POST /admin/login`); `/admin/login` pasa sin sesión; `GET /admin/login` con sesión válida → 303 a `/admin`; `/admin`, `/admin/cualquier-cosa` sin sesión → 303 a `/admin/login`; `/api/admin/x` sin sesión → 401 con `{"error":"unauthorized"}`; sesión válida pasa con `locals.session`; sesión vencida y cookie con hash inexistente → tratadas como sin sesión; error del almacén → sin sesión (falla cerrada); toda respuesta bajo `/admin` y `/api/admin` lleva `Cache-Control: no-store`

### Implementation for User Story 2

- [X] T024 [US2] Implementar `src/middleware.ts` con `defineMiddleware` siguiendo el orden exacto de "Reglas del middleware" en `contracts/http-routes.md`: (1) fuera de `/admin` y `/api/admin` pasa; (2) método no seguro sin `Origin` propio → 403; (3) `/admin/login` pasa y con sesión válida `GET` redirige 303 a `/admin`; (4) `/admin/*` sin sesión → 303 a `/admin/login`; (5) `/api/admin/*` sin sesión → 401 JSON; (6) con sesión, `locals.session` disponible; añadir `Cache-Control: no-store` a toda respuesta bajo esas rutas. Leer cookie (`__Host-session` o `session` en desarrollo), `env.DB` y `Date.now()` solo aquí y pasarlos a `validateSession` (depende de T011, T012)
- [X] T025 [US2] Confirmar el riesgo R1 (research D1): el middleware se ejecuta también en rutas inexistentes bajo `/admin`; verificarlo con `npm run build && npx astro preview` (quickstart §3 paso 1). Si no se ejecuta, añadir `src/pages/admin/[...rest].astro` que aplique la misma regla y documentarlo en `research.md`
- [X] T026 [US2] Hacer que `/admin/*` con sesión y ruta inexistente devuelva el 404 habitual del sitio (`src/pages/404.astro`) y comprobar que `/admin` con sesión devuelve 200 (contrato "GET /admin y GET /admin/*")

**Checkpoint**: US1 y US2 funcionan; el panel ya está protegido

---

## Phase 5: User Story 3 - Mantener la sesión en el celular y poder cerrarla (Priority: P2)

**Goal**: la sesión dura 30 días fijos aunque se cierre el navegador, es independiente por dispositivo, y "Salir" la invalida de inmediato en el servidor.

**Independent Test**: iniciar sesión, reabrir el navegador y entrar sin pedir datos; pulsar "Salir" y comprobar que el panel vuelve a exigir sesión, incluso con "atrás" (quickstart §3, pasos 6 y 8).

### Tests for User Story 3 ⚠️

- [X] T027 [P] [US3] Escribir `tests/auth/sessions.test.ts` (almacén en memoria, reloj inyectado): la sesión es válida a los 30 días menos 1 ms y vence a los 30 días exactos (sin renovación); se guarda solo el hash de 64 caracteres, distinto del token; dos logins crean dos filas independientes y borrar una no afecta a la otra (FR-009); `deleteSession` hace que el token deje de servir aunque se conserve una copia; `cleanupExpired` borra las vencidas y conserva las vigentes
- [X] T028 [P] [US3] Escribir `tests/auth/logout.test.ts`: `POST /api/admin/logout` con sesión borra la fila, responde 303 a `/admin/login` y expira la cookie (`Max-Age=0`); sin sesión → 401 (por el middleware); `Origin` ajeno → 403

### Implementation for User Story 3

- [X] T029 [US3] Crear `src/pages/api/admin/logout.ts` (`export const POST`): leer la cookie, llamar a `deleteSession` con la base, responder 303 a `/admin/login` con `Set-Cookie` de expiración (`Max-Age=0`, mismos atributos); `export const prerender = false` (depende de T011)
- [X] T030 [US3] Integrar la limpieza de vencidos: ejecutar `cleanupExpired` dentro del mismo `batch` que cada intento de login en `src/lib/auth/login.ts` (FR-018, research D7)
- [X] T031 [US3] Verificar con `tests/auth/middleware.test.ts` y a mano (quickstart §3 paso 8) que tras "Salir" el botón "atrás" no muestra el panel (cabecera `no-store`); ajustar `middleware.ts` si hace falta

**Checkpoint**: US1, US2 y US3 funcionan de forma independiente

---

## Phase 6: User Story 4 - Frenar los intentos repetidos de adivinar la contraseña (Priority: P2)

**Goal**: tras 5 fallos en 15 minutos se rechaza todo intento (aun con credenciales correctas) durante 15 minutos con un mensaje claro; un login correcto reinicia el conteo.

**Independent Test**: fallar 5 veces, intentar con la contraseña correcta y ver "Demasiados intentos. Intenta de nuevo en 15 minutos."; pasados 15 minutos (o `DELETE FROM login_attempts`) entra (quickstart §3, pasos 9 y 10).

### Tests for User Story 4 ⚠️

- [X] T032 [P] [US4] Escribir `tests/auth/throttle.test.ts` (reloj inyectado): 4 fallos no bloquean; el quinto bloquea; sigue bloqueado a 14 min 59 s del quinto fallo y se levanta a los 15 min; fallos separados por más de 15 min entre el más reciente y el quinto no bloquean; sin fallos no bloquea
- [X] T033 [P] [US4] Ampliar `tests/auth/login.test.ts`: con bloqueo activo, credenciales correctas e incorrectas devuelven `{ status: "locked" }` idéntico y no insertan fallos ni evalúan credenciales; un login correcto con 4 fallos previos entra y deja `login_attempts` vacío (FR-011); recuperación tras 15 minutos permite entrar; los fallos de más de 15 min se borran en cada intento (FR-018)
- [X] T034 [P] [US4] Ampliar `tests/auth/login-page.test.ts`: bloqueo → estado 429 con "Demasiados intentos. Intenta de nuevo en 15 minutos." en el mismo formulario

### Implementation for User Story 4

- [X] T035 [US4] Implementar `src/lib/auth/throttle.ts`: `isLocked(failures: number[], now: number)` según data-model.md ("sean `t1 ≥ … ≥ t5` los 5 fallos más recientes; hay bloqueo cuando existen los 5, `ahora − t1 < 15 min` y `t1 − t5 ≤ 15 min`") y constantes `WINDOW_MS = 900_000`, `MAX_FAILURES = 5`
- [X] T036 [US4] Integrar el bloqueo en `src/lib/auth/login.ts`: antes de mirar la credencial, borrar fallos antiguos y sesiones vencidas, leer `recentFailures(5)` y, si `isLocked`, devolver `{ status: "locked" }` sin evaluar credenciales ni registrar nada; en login correcto llamar `deleteAllFailures()` en el mismo `batch` que la inserción de la sesión (depende de T035)
- [X] T037 [US4] Mapear `locked` en `src/pages/admin/login.astro` a estado 429 con "Demasiados intentos. Intenta de nuevo en 15 minutos."

**Checkpoint**: las cuatro historias funcionan de forma independiente

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: despliegue, documentación y definición de terminado (constitución)

- [X] T038 Añadir a `.github/workflows/deploy.yml`, antes del paso `deploy`, un paso `cloudflare/wrangler-action@v4` con `command: d1 migrations apply DB --remote` (mismos `apiToken` y `accountId`) (research D9)
- [X] T039 [P] Actualizar `README.md`: cómo configurar `ADMIN_EMAIL` y `ADMIN_PASSWORD` (`.dev.vars` en local, `wrangler secret put` en producción, contraseña aleatoria de ≥20 caracteres), crear la base (`wrangler d1 create samuele-reposteria`), aplicar migraciones, permiso **D1: Edit** del token, e invalidar sesiones (`wrangler d1 execute DB --remote --command "DELETE FROM sessions"`); añadir `src/lib/auth/` y `migrations/` a la estructura del proyecto (FR-022, SC-010)
- [X] T040 [P] Actualizar `docs/adr/0006-autenticacion.md` con lo implementado (rutas, cookie `__Host-session`, desviación aceptada del doble envío sin JavaScript de research D8) y `docs/adr/0003-base-de-datos.md` si el esquema difiere
- [X] T041 Ejecutar `npm run check && npm run lint && npm run format:check && npm test && npm run build` y corregir lo que falle; confirmar que las pruebas existentes `tests/home.test.ts` y `tests/not-found.test.ts` siguen en verde (FR-021)
- [X] T042 Recorrer el quickstart §3 completo (13 pasos) con `npm run build && npx astro preview` en `workerd`, incluido el paso 12 (`id` de 64 caracteres distinto de la cookie) y el paso 13 (sin `ADMIN_PASSWORD` nadie entra); comprobar con `git status` que no se versiona `.dev.vars` ni ningún secreto — Verificado 2026-10-17 con `curl` sobre `astro preview` (workerd): los 13 pasos pasan; `id` de 64 caracteres distinto de la cookie; sin `ADMIN_PASSWORD` nadie entra (nota: el preview lee `dist/server/.dev.vars`, copiado en el build); `.dev.vars` ignorado y sin secretos versionables.
- [X] T043 Medir Lighthouse móvil sobre `/admin/login` con `npx lhci autorun` (añadir la URL a `lighthouserc.json`): rendimiento y accesibilidad ≥90 (SC-006) y confirmar que `/` y 404 mantienen ≥90 (SC-008) — Medido 2026-10-17 con `lhci autorun` (3 corridas por URL, Chromium 155 en Linux): `/` y `/admin/login` obtienen rendimiento 100 y accesibilidad 100. El 404 no se mide con `lhci` porque Lighthouse descarta las páginas con estado HTTP 404; su cobertura queda en `tests/not-found.test.ts`.
- [ ] T044 Probar en un celular real y registrar en el PR modelo, navegador y fecha: inicio de sesión en <20 s, gestor de contraseñas rellena los campos, sin desplazamiento horizontal desde 320 px, campos y botón ≥48 px, navegación solo con teclado y lector de pantalla (SC-001, SC-006, SC-007)
- [ ] T045 Tras fusionar a `main` y desplegar (quickstart §5): crear la base, cargar los secretos, verificar que el despliegue aplica la migración, medir CPU del login y de la verificación de sesión con `npx wrangler tail` (≤10 ms, SC-009), registrar el resultado en el PR y en el ADR 0006, y confirmar costo $0. Si se supera, aplicar la mitigación de research R2 (consulta SQL directa en la verificación de sesión)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; BLOQUEA todas las historias
- **US1 (Phase 3)** y **US2 (Phase 4)**: dependen de Foundational. US2 puede avanzar en paralelo con US1; su prueba de "sesión válida" usa el almacén en memoria, no el login
- **US3 (Phase 5)**: depende de Foundational; el botón "Salir" (T022) y el login (US1) permiten la prueba manual completa
- **US4 (Phase 6)**: depende de Foundational y de `login.ts` (T018) de US1
- **Polish (Phase 7)**: depende de las historias deseadas; T045 depende de la fusión a `main`

### Within Each User Story

- Pruebas primero y deben fallar antes de implementar
- `crypto` → `credentials`/`sessions` → `login` → páginas; `sessions` + `origin` → `middleware`

### Parallel Opportunities

- Setup: T002, T003 y T004 en paralelo
- Foundational: T008, T012 en paralelo; T009 y T013 (pruebas) en paralelo con sus pares
- US1: T014, T015, T016 en paralelo; luego T017 en paralelo con T020
- US2: T023 independiente; US2 puede ir en paralelo con US1 con otra persona
- US3: T027 y T028 en paralelo; US4: T032, T033 y T034 en paralelo
- Polish: T039 y T040 en paralelo

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 juntas:
Task: "tests/auth/credentials.test.ts"
Task: "tests/auth/login.test.ts"
Task: "tests/auth/login-page.test.ts"

# Luego, en paralelo (archivos distintos):
Task: "src/lib/auth/credentials.ts"
Task: "src/styles/global.css (estilos del formulario)"
```

---

## Implementation Strategy

### MVP First (US1 + US2, ambas P1)

1. Phase 1: Setup → Phase 2: Foundational
2. Phase 3: US1 (login) y Phase 4: US2 (protección). El login sin protección no cumple el principio III, por eso el MVP son ambas
3. **STOP y VALIDAR**: quickstart §3 pasos 1 a 5, 7 y 11
4. Desplegar solo si también se hizo US4 (el login expuesto en producción sin bloqueo deja la contraseña sin freno); si no, validar en local

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 + US2 → panel protegido y acceso funcional (MVP)
3. US3 → sesión de 30 días y "Salir"
4. US4 → bloqueo por fuerza bruta
5. Polish → despliegue, README/ADR, Lighthouse, celular real, medición de CPU
6. Un PR con CI en verde por la funcionalidad (constitución, principio VI); commits en inglés con `Refs: HU-06`

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- La etiqueta [Story] vincula cada tarea con su historia para trazabilidad
- Desviación aceptada: con JavaScript desactivado, un doble envío puede contar como dos fallos (research D8)
- Verificar que las pruebas fallan antes de implementar; hacer commit tras cada tarea o grupo lógico
- Evitar tareas vagas, conflictos en un mismo archivo (`login.ts` lo tocan T018, T030 y T036: en ese orden) y dependencias entre historias que rompan su independencia
