import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Sesión activa de un dispositivo. `id` es el SHA-256 hexadecimal del token, nunca el token. */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("sessions_expires_at_idx").on(table.expiresAt)],
);

/** Intento fallido reciente. Global: sin persona ni IP (ADR 0006). */
export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attemptedAt: integer("attempted_at").notNull(),
  },
  (table) => [index("login_attempts_attempted_at_idx").on(table.attemptedAt)],
);
