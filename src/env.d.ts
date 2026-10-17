/// <reference path="../.astro/types.d.ts" />

// Entorno del Worker: el binding DB viene de worker-configuration.d.ts (`npx wrangler types`);
// aquí se declaran los secretos de la administradora (ADR 0006).
// Se lee con `import { env } from "cloudflare:workers"` solo en el middleware y las páginas.
declare namespace Cloudflare {
  interface Env {
    ADMIN_EMAIL?: string;
    ADMIN_PASSWORD?: string;
  }
}

declare namespace App {
  interface Locals {
    session?: { id: string };
  }
}
