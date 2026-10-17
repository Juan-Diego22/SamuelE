import { defineConfig } from "drizzle-kit";

// Solo genera el SQL; la migración la aplica `wrangler d1 migrations apply` (ADR 0003).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
