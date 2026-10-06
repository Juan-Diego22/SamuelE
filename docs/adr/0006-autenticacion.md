# ADR 0006: Autenticación

**Status**: Accepted

**Date**: 2026-10-05

## Context

HU-06 requiere:
- Panel privado accesible solo a la administradora.
- Sesión persistente en el celular (sin pedir credenciales cada vez).
- Mensajes de error genéricos (no revelar si el email existe).

Hay un solo usuario (la propietaria). Sin roles, sin multi-usuario.

## Decision

- **Método**: email + contraseña, hasheada con bcrypt.
- **Sesión**: cookie con flags secure, HttpOnly, SameSite=Lax. Duración: 30 días.
- **Invalidación**: cerrar sesión borra la cookie en el cliente; el servidor valida el token en cada request.

## Rationale

- **Simple**: una contraseña es suficiente para un usuario.
- **Estándar**: cookies funcionan en navegadores sin librerías adicionales.
- **Seguro**: HttpOnly previene acceso desde JavaScript (XSS). Secure obliga HTTPS (Cloudflare Pages/Workers son HTTPS por defecto).
- **Sin terceros**: no depende de OAuth ni de un servicio de identidad (mantiene costo $0).

## Consequences

- Sin 2FA (dos factores). Si alguien obtiene la contraseña, entra. Mitiga con mensaje de reset fuerte.
- Sin recordar datos de sesión en servidor (stateless). Si necesitas invalidar todas las sesiones de un usuario, requiere cambio de contraseña.
- Contraseña almacenada en D1 como hash bcrypt. El usuario debe usar una contraseña fuerte (validar en el formulario: ≥12 caracteres).

## Alternatives Considered

1. **OAuth (Google, GitHub)**: más seguro, pero requiere terceros. Rechazado.
2. **Passwordless (magic link por email)**: más moderno, pero requiere servicio de email (SendGrid, etc.). Rechazado.
3. **Session storage (sin cookies)**: localStorage no es seguro contra XSS. Rechazado.

## References

- Principio III: Privacidad y Seguridad por Defecto
- HU-06: Iniciar sesión
- ADR 0002: Stack Tecnológico
