# ADR 0006: Autenticación del panel

- **Estado**: aceptada
- **Fecha**: 2026-10-05
- **Revisión**: 2026-10-06. Se reemplaza bcrypt por una credencial de alta entropía guardada como secreto, porque un hash lento no cabe en los 10 ms de CPU del plan gratuito. Se define la sesión con estado en D1, la protección contra fuerza bruta y CSRF.

## Contexto

HU-06 pide:

- que sin sesión, cualquier ruta del panel redirija al login;
- un error genérico que no revele qué dato falló;
- una sesión que se mantenga en el celular;
- poder cerrar sesión.

Hay una sola administradora y no hay planes de agregar más usuarios. El mockup define un login con correo y contraseña.

Un hash de contraseñas adecuado (bcrypt, o PBKDF2 con las iteraciones recomendadas) [cuesta decenas de ms de CPU](https://flaviocopes.com/native-email-password-authentication-cloudflare-workers/), y el Worker gratuito permite 10 ms por request (ADR 0002).

## Decisión

- **Credencial**: correo y contraseña de la administradora, guardados como **secretos del Worker** (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). No van en la base ni en el repositorio.
  - La contraseña se **genera aleatoriamente** (al menos 20 caracteres) y se guarda en el gestor de contraseñas o el llavero de su celular.
  - Un hash lento protege contraseñas débiles si se filtra la base. Aquí la contraseña es de alta entropía y no está en la base, así que ese riesgo no aplica.
- **Comparación**: en tiempo constante (`crypto.subtle.timingSafeEqual` sobre resúmenes SHA-256), con el mismo error genérico para correo o contraseña incorrectos.
- **Fuerza bruta**: tabla `login_attempts` en D1. Tras 5 fallos en 15 minutos se rechazan los intentos durante 15 minutos.
- **Sesión**:
  - token aleatorio de 32 bytes, en cookie `HttpOnly; Secure; SameSite=Lax; Path=/`, con duración de 30 días;
  - en D1 se guarda solo su hash SHA-256 con la fecha de expiración (tabla `sessions`);
  - cerrar sesión borra la fila y la cookie.
- **Protección de rutas**: un middleware de Astro protege `/admin/*` y `/api/admin/*`. Sin sesión válida, las páginas redirigen a `/admin/login` y la API responde 401.
- **CSRF**: además de `SameSite=Lax`, toda petición que modifica datos verifica que el encabezado `Origin` coincida con el sitio.
- **Cambio o recuperación**: el desarrollador actualiza el secreto con `wrangler secret put` y borra las sesiones. Es suficiente para un único usuario.

## Consecuencias

- Todo cabe en el plan gratuito: SHA-256 y la consulta a D1 cuestan muy poca CPU.
- La pantalla de login del mockup se implementa tal cual.
- El bloqueo es global: alguien podría provocar fallos a propósito para bloquear a la administradora durante 15 minutos. Se acepta por el bajo riesgo de este sitio.
- La administradora no puede cambiar su contraseña desde el panel. Se acepta para la Fase 1.
- Sin segundo factor. Se reevalúa si el panel llega a manejar datos sensibles (finanzas, en la Fase 2a).
- Pruebas obligatorias (principio V): login correcto, error genérico, bloqueo tras fallos, expiración, cierre de sesión y redirección sin sesión.

## Alternativas consideradas

1. **Cloudflare Access con código por correo**: es más seguro y no guarda contraseña, y es gratis hasta 50 usuarios. Se descarta porque sin dominio propio protege toda la URL del Worker y no solo `/admin`, lo que obligaría a un segundo Worker. También exige registrar un medio de pago en Zero Trust y reemplaza el login del mockup. Se reevalúa si se compra un dominio.
2. **Contraseña con bcrypt o PBKDF2 en D1**: no cabe en 10 ms de CPU sin debilitar el hash.
3. **OAuth (Google)**: agrega dependencia y configuración de un proveedor externo para un solo usuario.
4. **Token en `localStorage`**: expuesto a XSS.

## Referencias

- Constitución: principio III y principio V.
- PRD Fase 1: HU-06.
- ADR 0002, ADR 0003.
