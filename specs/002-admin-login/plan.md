# Plan de implementación: Inicio de sesión de la administradora

**Rama**: `feature/002-admin-login` | **Fecha**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Entrada**: especificación en `specs/002-admin-login/spec.md` (Hito 2 del PRD, HU-06).

## Resumen

Pantalla `/admin/login` (correo y contraseña), sesión con estado en Cloudflare D1 (cookie `HttpOnly; Secure; SameSite=Lax` de 30 días; en la base solo el hash SHA-256 del token), bloqueo global tras 5 fallos en 15 minutos, y un middleware de Astro que protege `/admin/*` (redirige) y `/api/admin/*` (401), con verificación de `Origin` en peticiones que modifican datos. La credencial es un secreto del Worker (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) comparado en tiempo constante sobre resúmenes SHA-256, sin hash lento (cabe en 10 ms de CPU). Todo es decisión ya tomada en los ADR 0003 y 0006; la investigación ([research.md](research.md)) solo resuelve detalles de implementación.

## Technical Context

**Language/Version**: TypeScript 6.0.x (fijado en 001), Node 22 en desarrollo y CI; runtime `workerd`.

**Primary Dependencies**: Astro 7 + `@astrojs/cloudflare` 14 (ya instalados), `drizzle-orm` y `drizzle-kit` (ADR 0003). Sin librerías de autenticación: se usa Web Crypto.

**Storage**: Cloudflare D1, binding `DB`. Tablas `sessions` y `login_attempts` (ver [data-model.md](data-model.md)). Migraciones SQL versionadas en `migrations/`, aplicadas con `wrangler d1 migrations apply`.

**Testing**: Vitest 5 (ya configurado). Lógica de autenticación pura con dependencias inyectadas y un almacén en memoria; páginas con `AstroContainer`; middleware con contexto simulado. Verificación contra D1 real local con `wrangler d1 execute --local` (ver [quickstart.md](quickstart.md)).

**Target Platform**: Cloudflare Workers (plan gratuito); cliente: navegador móvil actual.

**Project Type**: aplicación web de un solo Worker (SSR con Astro).

**Performance Goals**: inicio de sesión y verificación de sesión ≤10 ms de CPU por petición (SC-009); Lighthouse móvil ≥90 en rendimiento y accesibilidad (SC-006).

**Constraints**: costo $0 recurrente; ≤50 consultas D1 por invocación; panel solo para navegadores actuales; formulario sin JavaScript obligatorio.

**Scale/Scope**: una administradora, decenas de peticiones por día; 3 páginas nuevas, 1 ruta de API (cierre de sesión), 1 middleware, 2 tablas.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Costo cero | D1 gratuito (5 M lecturas y 100 k escrituras/día, ADR 0003); sin servicios nuevos. Una sesión por login y un par de escrituras por intento: muy por debajo del límite. | Pasa |
| II. Móvil primero y accesibilidad | Campos y botón ≥48 px, contraste ≥4.5:1 con la paleta del mockup, etiquetas asociadas, error con `role="alert"`, funciona solo con teclado. Prueba en celular real y Lighthouse en la definición de terminado (SC-006, SC-007). | Pasa |
| III. Privacidad y seguridad | Panel con autenticación; secretos fuera del repositorio (`.dev.vars` ignorado); token solo como hash en D1. | Pasa |
| IV. Alcance disciplinado | Solo HU-06 y la base mínima (`sessions`, `login_attempts`). No se crean `categories` ni `works` (Hitos 3 y 5). Panel = marcador. | Pasa |
| V. Calidad verificable | Pruebas obligatorias de FR-020 enumeradas en la estrategia de pruebas (abajo). | Pasa |
| VI. Entrega continua | Cambio por PR con CI. Se añade a `deploy.yml` el paso de migraciones D1 (ver research D9). | Pasa |
| VII. Decisiones y documentación | Se actualizan ADR 0006 (e ADR 0003 si cambia el esquema) y README (FR-022). Código en módulos pequeños bajo `src/lib/auth/`. | Pasa |

Sin violaciones: la tabla de Complexity Tracking no aplica.

**Re-evaluación tras el diseño (Fase 1)**: sin cambios. El diseño no agrega servicios, tablas ni dependencias fuera de lo decidido en los ADR. El único riesgo abierto es el de CPU (D6), que se mide tras el despliegue.

## Project Structure

### Documentación (esta funcionalidad)

```text
specs/002-admin-login/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── http-routes.md
└── tasks.md          # lo genera /speckit-tasks
```

### Código fuente (raíz del repositorio)

```text
migrations/
└── 0001_sessions_and_login_attempts.sql   # generada con drizzle-kit, aplicada con wrangler
drizzle.config.ts
src/
├── db/
│   └── schema.ts                          # tablas sessions y login_attempts (Drizzle)
├── lib/auth/
│   ├── crypto.ts                          # SHA-256, token aleatorio, comparación en tiempo constante
│   ├── credentials.ts                     # normaliza correo y verifica credencial contra secretos
│   ├── throttle.ts                        # regla de bloqueo (5 fallos / 15 min)
│   ├── sessions.ts                        # crear, validar y borrar sesión; limpieza de vencidos
│   ├── login.ts                           # caso de uso: orquesta throttle + credenciales + sesión
│   ├── origin.ts                          # verificación de Origin para métodos que modifican
│   └── store.ts                           # interfaz AuthStore + implementación D1 (Drizzle)
├── middleware.ts                          # protege /admin/* y /api/admin/*; cabeceras no-store
├── layouts/
│   └── BaseLayout.astro                   # (existente) se reutiliza
├── components/
│   └── BrandHeader.astro                  # (existente) se reutiliza para el logo
├── pages/
│   ├── admin/
│   │   ├── index.astro                    # panel mínimo: "Panel de trabajos" + "Salir"
│   │   └── login.astro                    # GET muestra el formulario, POST procesa el login
│   └── api/admin/
│       └── logout.ts                      # POST: borra la sesión y la cookie
└── styles/global.css                      # (existente) estilos del formulario
tests/
└── auth/                                  # crypto, credentials, throttle, sessions, login, origin,
                                           # middleware y páginas
wrangler.jsonc                             # + binding d1_databases "DB"
.dev.vars.example                          # ADMIN_EMAIL y ADMIN_PASSWORD de ejemplo
```

**Decisión de estructura**: se mantiene el proyecto único de Astro de la funcionalidad 001. La lógica de autenticación vive en `src/lib/auth/` sin importar `cloudflare:workers` (recibe `db` y `env` por parámetro), de modo que se prueba con Vitest en Node sin `workerd`. Solo `middleware.ts` y las páginas leen el entorno del Worker y lo pasan hacia adentro.

### Estrategia de pruebas (FR-020)

| Requisito de prueba | Dónde |
|---|---|
| Inicio de sesión correcto | `login.test.ts` + página POST |
| Mensaje idéntico para correo y contraseña incorrectos | `login.test.ts` (mismo resultado) y página (mismo HTML) |
| Bloqueo tras 5 fallos y recuperación a los 15 min | `throttle.test.ts` / `login.test.ts` con reloj inyectado |
| Vencimiento de sesión (30 días) | `sessions.test.ts` |
| Cierre de sesión | `sessions.test.ts` + ruta `logout` |
| Redirección sin sesión (páginas, incluso rutas inexistentes) y 401 en `/api/admin` | `middleware.test.ts` |
| Origin ajeno rechazado | `origin.test.ts` / `middleware.test.ts` |
| Falla cerrada sin secretos o sin base | `login.test.ts` |
| Páginas públicas intactas | pruebas existentes `home` y `not-found` |

## Complexity Tracking

Sin violaciones que justificar.
