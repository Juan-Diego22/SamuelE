# Investigación (Fase 0): Inicio de sesión de la administradora

**Fecha**: 2026-10-11.

Decisiones **heredadas y no reabiertas**: ADR 0002 (Astro + Cloudflare, un Worker), ADR 0003 (D1 + Drizzle, migraciones con `wrangler d1 migrations apply`), ADR 0006 (secretos `ADMIN_EMAIL`/`ADMIN_PASSWORD`, SHA-256 + comparación en tiempo constante, sesión con estado en D1, bloqueo global, CSRF por `Origin`), ADR 0007 (tipografía). No hay "NEEDS CLARIFICATION" abiertos; abajo van los detalles de implementación que la spec dejó a este plan.

## D1. Protección de rutas: middleware de Astro

- **Decisión**: `src/middleware.ts` con `defineMiddleware`. Para `/admin/*` (salvo `/admin/login`) sin sesión válida responde con redirección 303 a `/admin/login`; para `/api/admin/*` responde 401 JSON. Añade `Cache-Control: no-store` a toda respuesta bajo `/admin` y `/api/admin`.
- **Razón**: ADR 0006 ya lo fija. Al estar en el middleware (y no en cada página) cubre también rutas inexistentes bajo `/admin`, requisito de FR-005. `no-store` impide que el botón "atrás" muestre contenido del panel tras cerrar sesión (escenario 4 de la historia 3).
- **Riesgo R1**: confirmar que el middleware se ejecuta cuando ninguna ruta coincide (404). Se verifica con una prueba y en `astro preview` (en `workerd`). Si no se ejecutara, se agrega una ruta comodín `src/pages/admin/[...rest].astro` que aplique la misma regla.
- **Alternativa**: comprobar la sesión dentro de cada página. Descartada: se olvida fácilmente y no cubre rutas inexistentes.

## D2. Acceso a D1 y secretos desde el código

- **Decisión**: leer el binding y los secretos con `import { env } from "cloudflare:workers"` solo en el middleware y las páginas; la lógica de `src/lib/auth/` recibe `db` y `env` como parámetros.
- **Razón**: es el acceso que documenta el adaptador de Cloudflare 13+ (sustituye a `Astro.locals.runtime.env`). Inyectar las dependencias permite probar en Node, donde el módulo `cloudflare:workers` no existe (misma limitación que R1 de la funcionalidad 001: Vitest corre sin adaptador).
- **Verificación pendiente**: confirmar la forma exacta del acceso en la versión instalada (`@astrojs/cloudflare` 14.3) al implementar la primera tarea; si difiere, solo cambia el punto de lectura.
- **Alternativa**: `@cloudflare/vitest-pool-workers`. Descartada en 001 (exige Vitest 4.1; aquí Vitest 5) y sobra para esta lógica.

## D3. Esquema, Drizzle y migraciones

- **Decisión**: `src/db/schema.ts` con Drizzle (ADR 0003); `drizzle-kit generate` crea el SQL en `migrations/` (carpeta que `wrangler d1 migrations apply` lee por defecto) y `wrangler.jsonc` apunta a ella con `migrations_dir`. Solo dos tablas (ver [data-model.md](data-model.md)). Fechas como enteros (milisegundos Unix UTC).
- **Razón**: enteros son comparables con índices y no dependen de formato de texto; el reloj se inyecta como `Date.now()` en las pruebas.
- **Alternativa**: SQL escrito a mano sin Drizzle. Descartada: el ADR 0003 ya eligió Drizzle y las fases siguientes agregarán tablas; así el esquema queda tipado desde ahora.
- **Detalle**: para dos tablas y consultas triviales se usa el constructor de consultas de Drizzle; no hay capa de repositorios adicional más allá de la interfaz `AuthStore` (D8).

## D4. Token de sesión y cookie

- **Decisión**: 32 bytes de `crypto.getRandomValues`, codificados en base64url; en D1 se guarda `SHA-256(token)` en hexadecimal como clave primaria. Cookie `__Host-session` con `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`, sin `Domain`.
- **Razón**: el prefijo `__Host-` obliga al navegador a exigir `Secure`, `Path=/` y ningún `Domain`, lo que endurece la cookie sin costo. 30 días = 2 592 000 s (FR-007). Un hash rápido basta porque el token tiene 256 bits de entropía (ADR 0006).
- **Local**: `Secure` solo se omite en `astro dev` sobre `http://localhost` (donde `__Host-` tampoco aplica); se usa el nombre `session` cuando no es producción. Se decide con `import.meta.env.PROD`.
- **Vencimiento**: fijo a 30 días desde el login, sin renovación deslizante (la spec dice "desde el inicio de sesión", FR-007).

## D5. Credencial y tiempo de respuesta uniforme

- **Decisión**: normalizar el correo (`trim` + minúsculas) en la entrada y en `ADMIN_EMAIL`; calcular SHA-256 de ambos correos y de ambas contraseñas, comparar **ambas** parejas con `crypto.subtle.timingSafeEqual` (extensión de Workers) sin cortocircuito y combinar los resultados al final. Si falta `ADMIN_EMAIL` o `ADMIN_PASSWORD`, el resultado es siempre "rechazado" (falla cerrada, FR-002 y caso límite).
- **Razón**: el hash previo iguala la longitud de las entradas (requisito de `timingSafeEqual`) y evita fugas por longitud. Evaluar las dos comparaciones siempre elimina la diferencia de tiempo entre "correo mal" y "contraseña mal" (FR-003).
- **Nota**: no se normaliza la contraseña (solo se ignoran mayúsculas y espacios del correo, según la spec).

## D6. CPU: presupuesto y medición

- **Decisión**: el costo por intento es 4 SHA-256 sobre entradas cortas más 2 a 4 consultas D1. Las consultas se agrupan con `db.batch` para reducir idas y vueltas. Se mide con el reporte de CPU de `wrangler tail`/observabilidad tras el despliegue (SC-009) y el resultado se registra en el PR y en el ADR 0006.
- **Razón**: SHA-256 sobre bytes cortos es del orden de microsegundos en Workers; el tiempo esperando a D1 no cuenta como CPU. Esta medición es la que pide ADR 0002 y la tarea T030 de la funcionalidad 001 dejó aceptado un riesgo similar.
- **Riesgo R2**: que el middleware de Astro, el render SSR y Drizzle sumen más de 10 ms en frío. Mitigación: si se supera, quitar Drizzle del camino de verificación de sesión (consulta SQL directa por `prepare`) antes de tocar el diseño.

## D7. Bloqueo por fallos (5 en 15 minutos, 15 minutos de espera)

- **Decisión**: tabla `login_attempts` con solo fallos. Antes de mirar la credencial: se leen los 5 fallos más recientes (`ORDER BY attempted_at DESC LIMIT 5`). Hay bloqueo si existen 5, el más reciente tiene menos de 15 min y entre el más reciente y el quinto hay ≤15 min. Los intentos rechazados por bloqueo **no se registran** (así el bloqueo no se prolonga indefinidamente). Un login correcto borra todos los fallos (FR-011).
- **Razón**: el bloqueo dura 15 min contados desde el quinto fallo (escenarios 1 a 3 de la historia 4) y se levanta solo, sin estado extra ni columna de "bloqueado hasta". Con el mismo criterio el sexto intento bloqueado no cambia nada.
- **Limpieza (FR-018)**: en cada intento de login se borran los fallos de más de 15 min y las sesiones vencidas, dentro del mismo `batch`. No hace falta una tarea programada.
- **Alternativa**: Cron Trigger para limpiar. Descartada: más piezas por nada; la limpieza al consultar basta a este volumen.

## D8. Doble envío del formulario

- **Decisión**: un script mínimo en la página deshabilita el botón al enviar (mejora progresiva, FR-016: sin JavaScript sigue funcionando). En servidor no hay deduplicación: dos envíos simultáneos con credenciales correctas crean dos sesiones válidas e independientes, inofensivas (FR-009); con credenciales incorrectas cuentan como dos fallos.
- **Razón**: el caso límite pide "una sola vez" desde el punto de vista de la usuaria. El script lo cumple en el celular, y deduplicar en servidor exigiría un token por formulario (más estado) para un riesgo mínimo. Se deja constancia como desviación aceptada del texto literal "ni cuenta como dos fallos" cuando JavaScript está desactivado.
- **Alternativa**: token de formulario de un solo uso en D1. Descartada por costo/beneficio.

## D9. Migraciones en el despliegue y almacén de pruebas

- **Decisión**: `deploy.yml` ejecuta `wrangler d1 migrations apply DB --remote` antes de `wrangler deploy`. El token de Cloudflare del repositorio necesita permiso **D1: Edit**. La base se crea una vez con `wrangler d1 create` y su `database_id` va en `wrangler.jsonc` (no es secreto).
- **Razón**: sin ese paso un despliegue nuevo encontraría la base sin tablas y el login fallaría cerrado. ADR 0003 pide exportar con `wrangler d1 export` antes de migrar esquemas; para la primera migración (base vacía) no hay nada que respaldar.
- **Pruebas**: la interfaz `AuthStore` tiene una implementación en memoria para Vitest y otra con D1. La de D1 se verifica con `wrangler d1 execute --local` (quickstart), porque Vitest en Node no tiene D1.

## D10. Interfaz del formulario

- **Decisión**: `GET /admin/login` muestra el formulario; `POST /admin/login` lo procesa y, si falla, devuelve la misma página con el mensaje (estado 200 para credenciales incorrectas, 429 para bloqueo, 503 para base caída). Éxito: 303 a `/admin` con `Set-Cookie`. Campos `type="email"` y `type="password"` con `autocomplete="username"`/`"current-password"` para que el gestor de contraseñas del celular los rellene, `required`, alto mínimo 48 px. Error en un `<p role="alert">` enlazado con `aria-describedby`.
- **Razón**: el POST a la misma URL funciona sin JavaScript (FR-016), sin necesidad de una ruta de API aparte. Reutiliza `BaseLayout` y la paleta ya definida en `global.css`. Los errores 200 vs 429 no revelan cuál dato falló.
- **Logo**: el mismo recurso de 001 (`src/assets/logo-samuele.jpg`), grande y recortado en círculo según el mockup.

## D11. Cierre de sesión

- **Decisión**: botón "Salir" dentro de un `<form method="post" action="/api/admin/logout">`; la ruta borra la fila de `sessions`, expira la cookie y responde 303 a `/admin/login`.
- **Razón**: una petición POST protegida por `Origin` evita que un tercero cierre la sesión con un enlace; vive bajo `/api/admin` y por tanto también exige sesión (si ya no hay, el 401 es inocuo).
