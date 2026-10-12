# Guía de validación: Inicio de sesión de la administradora

Prueba de extremo a extremo de la funcionalidad. Detalle de rutas en [contracts/http-routes.md](contracts/http-routes.md) y de tablas en [data-model.md](data-model.md).

## Requisitos previos

- Node 22 y `npm ci` ejecutado.
- Cuenta de Cloudflare con `wrangler login` hecho (solo para la parte remota).
- Un correo y una contraseña de prueba (en producción: contraseña aleatoria de ≥20 caracteres).

## 1. Configuración local

```bash
cp .dev.vars.example .dev.vars        # editar ADMIN_EMAIL y ADMIN_PASSWORD
npx wrangler d1 migrations apply DB --local
```

Esperado: la migración `0001_sessions_and_login_attempts` aplicada. Confirmar las tablas:

```bash
npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table'"
```

Esperado: `sessions` y `login_attempts`.

## 2. Verificaciones automáticas

```bash
npm run check && npm run lint && npm run format:check && npm test && npm run build
```

Esperado: todo en verde; las pruebas de `tests/auth/` cubren FR-020.

## 3. Recorrido manual (en `workerd`, como producción)

```bash
npm run build && npx astro preview
```

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Abrir `/admin` y `/admin/cualquier-cosa` sin sesión | Redirección a `/admin/login` |
| 2 | `curl -i -X POST /api/admin/logout` sin sesión | 401 |
| 3 | Enviar el formulario vacío | Aviso de completar ambos campos |
| 4 | Correo incorrecto y luego contraseña incorrecta | Mismo mensaje "Correo o contraseña incorrectos." |
| 5 | Credenciales correctas | Llega a `/admin` con "Panel de trabajos" y "Salir" |
| 6 | Cerrar y reabrir el navegador (dentro de 30 días) | Entra sin pedir datos |
| 7 | Con sesión, abrir `/admin/login` | Va directo a `/admin` |
| 8 | Pulsar "Salir" y luego "atrás" | Vuelve al inicio de sesión; no se ve el panel |
| 9 | Cinco fallos seguidos y luego la contraseña correcta | "Demasiados intentos. Intenta de nuevo en 15 minutos." |
| 10 | Pasados 15 minutos, credenciales correctas | Entra |
| 11 | Abrir `/` y una ruta inexistente fuera del panel | Sitio público sin cambios, sin pedir sesión |
| 12 | Tabla `sessions` (`SELECT id FROM sessions`) | `id` es un hash de 64 caracteres, distinto del valor de la cookie |
| 13 | Quitar `ADMIN_PASSWORD` de `.dev.vars` y reiniciar | Nadie entra; el sitio público sigue funcionando |

Para el paso 10 sin esperar: `npx wrangler d1 execute DB --local --command "DELETE FROM login_attempts"`.

## 4. Dispositivo real y calidad (definición de terminado)

1. En un celular real (modelo, navegador y fecha anotados en el PR): iniciar sesión en menos de 20 segundos (SC-001), comprobar que el gestor de contraseñas rellena los campos, que no hay desplazamiento horizontal desde 320 px y que los campos y el botón miden ≥48 px.
2. Lighthouse móvil sobre `/admin/login` (`npx lhci autorun`): rendimiento y accesibilidad ≥90 (SC-006).
3. Recorrer el formulario solo con teclado y con un lector de pantalla: etiquetas y mensaje de error anunciados.
4. Comprobar que `/` y la página 404 mantienen su puntuación de 001 (SC-008).

## 5. Despliegue y medición de CPU

1. Una sola vez: `npx wrangler d1 create samuele-reposteria` y poner su `database_id` en `wrangler.jsonc`; cargar secretos con `npx wrangler secret put ADMIN_EMAIL` y `ADMIN_PASSWORD`; dar al token de Cloudflare del repositorio el permiso **D1: Edit**.
2. Fusionar el PR a `main`: el despliegue aplica las migraciones y publica.
3. Hacer un login y una verificación de sesión; revisar el CPU por petición en `npx wrangler tail` o en el panel de observabilidad y registrarlo en el PR: debe ser ≤10 ms (SC-009).
4. Confirmar que la factura sigue en $0.

## 6. Invalidar todas las sesiones (cambio de credencial o dispositivo perdido)

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler d1 execute DB --remote --command "DELETE FROM sessions"
```

Esperado: el dispositivo antiguo vuelve a ver el inicio de sesión.
