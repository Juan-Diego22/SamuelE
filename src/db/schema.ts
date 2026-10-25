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

/** Agrupación fija de trabajos; las cuatro filas se insertan en la migración. */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
  position: integer("position").notNull(),
});

/** Un trabajo publicado. `id` es un UUID generado por el navegador (hace idempotente el reintento). */
export const works = sqliteTable(
  "works",
  {
    id: text("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    /** ≤80 caracteres; obligatorio al escribir, nulo solo en filas antiguas de 003. */
    title: text("title"),
    /** ≤1000 caracteres; nulo si queda vacío. */
    description: text("description"),
    /** Sube en 1 cada vez que se reemplaza la foto (HU-09). */
    photoVersion: integer("photo_version").notNull(),
    /** `webp` o `jpg`; igual para las tres derivadas. */
    photoExt: text("photo_ext").notNull(),
    /** Milisegundos desde 1970 (UTC). */
    createdAt: integer("created_at").notNull(),
    /** `NULL` = activo. Milisegundos desde 1970 (UTC) del momento del retiro. */
    retiredAt: integer("retired_at"),
  },
  (table) => [
    index("works_created_at_idx").on(table.createdAt),
    index("works_category_id_idx").on(table.categoryId),
  ],
);
