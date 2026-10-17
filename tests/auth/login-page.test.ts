import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import LoginForm from "../../src/components/LoginForm.astro";
import { describeFailure, MESSAGES } from "../../src/lib/auth/messages";

async function render(error?: string) {
  const container = await AstroContainer.create();
  return container.renderToString(LoginForm, { props: { error } });
}

describe("formulario de inicio de sesión", () => {
  it("tiene campos con etiqueta, autocompletado y botón", async () => {
    const html = await render();
    expect(html).toContain('<label for="email">Correo</label>');
    expect(html).toContain('<label for="password">Contraseña</label>');
    expect(html).toContain('autocomplete="username"');
    expect(html).toContain('autocomplete="current-password"');
    expect(html).toMatch(/type="email"[^>]*required|required[^>]*type="email"/);
    expect(html).toContain("Ingresar");
    expect(html).not.toContain('role="alert"');
  });

  it("el error de correo mal y de contraseña mal es idéntico", async () => {
    const a = describeFailure("invalid");
    const b = describeFailure("invalid");
    expect(await render(a.message)).toBe(await render(b.message));
    const html = await render(a.message);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Correo o contraseña incorrectos.");
    expect(html).toContain('aria-describedby="login-error"');
  });

  it("muestra aviso de campos vacíos y de base caída con su estado", async () => {
    expect(await render(MESSAGES.empty)).toContain(
      "Completa tu correo y tu contraseña.",
    );
    expect(describeFailure("empty").httpStatus).toBe(200);
    const down = describeFailure("unavailable");
    expect(down.httpStatus).toBe(503);
    expect(await render(down.message)).toContain(
      "No pudimos iniciar sesión, intenta de nuevo en unos minutos",
    );
  });

  it("el bloqueo responde 429 con el mensaje de espera", async () => {
    const locked = describeFailure("locked");
    expect(locked.httpStatus).toBe(429);
    expect(await render(locked.message)).toContain(
      "Demasiados intentos. Intenta de nuevo en 15 minutos.",
    );
  });
});
