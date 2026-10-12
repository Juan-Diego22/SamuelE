# Modelo de datos: Inicio de sesión de la administradora

Base: Cloudflare D1 (SQLite), binding `DB`. Esquema en `src/db/schema.ts` (Drizzle); migración `migrations/0001_sessions_and_login_attempts.sql`. No hay tabla de usuarios ni de contraseñas (FR-017, ADR 0006).

## `sessions` — sesión activa de un dispositivo

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | TEXT, clave primaria | SHA-256 del token, en hexadecimal (64 caracteres). Nunca el token original (FR-013). |
| `created_at` | INTEGER, no nulo | Milisegundos Unix UTC del inicio de sesión. |
| `expires_at` | INTEGER, no nulo | `created_at` + 30 días (2 592 000 000 ms). Fijo, sin renovación. |

- **Índice**: `sessions_expires_at_idx` sobre `expires_at` (limpieza de vencidas).
- **Válida** si la fila existe y `expires_at > ahora`.
- **Transiciones**: creada en el login correcto → (a) borrada con "Salir" o (b) vencida y borrada en la siguiente limpieza. Una fila vencida nunca cuenta como válida aunque no se haya limpiado todavía.
- **Independencia** (FR-009): cada login inserta una fila nueva; ninguna operación afecta a otras filas excepto la limpieza de vencidas y la invalidación manual de todas.

## `login_attempts` — intento fallido reciente

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER, clave primaria autoincremental | |
| `attempted_at` | INTEGER, no nulo | Milisegundos Unix UTC del fallo. |

- **Índice**: `login_attempts_attempted_at_idx` sobre `attempted_at`.
- Solo se registran **fallos de credencial** (no los rechazados por bloqueo ni los vacíos, que no consultan nada).
- **Global**: sin columna de persona ni de IP (FR-010, ADR 0006).
- **Bloqueo** (calculado, no almacenado): sean `t1 ≥ … ≥ t5` los 5 fallos más recientes; hay bloqueo cuando existen los 5, `ahora − t1 < 15 min` y `t1 − t5 ≤ 15 min`.
- **Ciclo de vida**: insertado en cada fallo → borrado al pasar 15 min (limpieza en cada intento) o al primer login correcto (se borran todos, FR-011).

## Credencial de la administradora (no persistida)

Secretos del Worker `ADMIN_EMAIL` y `ADMIN_PASSWORD` (en producción con `wrangler secret put`; en desarrollo en `.dev.vars`, fuera de git). Si falta cualquiera, el login rechaza siempre.

## Presupuesto de D1 por operación

| Operación | Escrituras | Lecturas (filas) |
|---|---|---|
| Verificar sesión (cada página/API del panel) | 0 | 1 |
| Login con fallo | 2 (limpieza + insertar fallo) | ≤5 |
| Login correcto | 3 (limpieza, borrar fallos, insertar sesión) | ≤5 |
| Cerrar sesión | 1 | 0 |

Muy por debajo de 100 000 escrituras y 5 M lecturas al día (ADR 0003), incluso bajo un ataque de fuerza bruta sostenido, ya que el bloqueo corta las escrituras tras 5 fallos.

## Invalidar todas las sesiones (tarea del desarrollador)

```text
npx wrangler d1 execute DB --remote --command "DELETE FROM sessions"
```
