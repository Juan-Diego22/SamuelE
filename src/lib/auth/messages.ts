import type { LoginResult } from "./login";

export const MESSAGES = {
  empty: "Completa tu correo y tu contraseña.",
  locked: "Demasiados intentos. Intenta de nuevo en 15 minutos.",
  invalid: "Correo o contraseña incorrectos.",
  unavailable: "No pudimos iniciar sesión, intenta de nuevo en unos minutos",
} as const;

/** Estado HTTP y mensaje visible para un resultado que no es éxito. */
export function describeFailure(status: Exclude<LoginResult["status"], "ok">): {
  httpStatus: number;
  message: string;
} {
  switch (status) {
    case "empty":
      return { httpStatus: 200, message: MESSAGES.empty };
    case "invalid":
      return { httpStatus: 200, message: MESSAGES.invalid };
    case "locked":
      return { httpStatus: 429, message: MESSAGES.locked };
    case "unavailable":
      return { httpStatus: 503, message: MESSAGES.unavailable };
  }
}
