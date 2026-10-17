import { desc, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { loginAttempts, sessions } from "../../db/schema";

export interface StoredSession {
  id: string;
  createdAt: number;
  expiresAt: number;
}

/** Acceso a datos de autenticación; la lógica no conoce D1 (se prueba con la versión en memoria). */
export interface AuthStore {
  insertSession(session: StoredSession): Promise<void>;
  findSession(id: string): Promise<StoredSession | null>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(now: number): Promise<void>;
  /** Momentos de los fallos más recientes, del más nuevo al más antiguo. */
  recentFailures(limit: number): Promise<number[]>;
  insertFailure(at: number): Promise<void>;
  deleteFailuresBefore(cutoff: number): Promise<void>;
  deleteAllFailures(): Promise<void>;
  /** Ejecuta varias escrituras en una sola ida y vuelta (D1 `batch`). */
  batch(ops: Array<() => Promise<void>>): Promise<void>;
}

export function createD1Store(d1: D1Database): AuthStore {
  const db = drizzle(d1);
  return {
    async insertSession(s) {
      await db.insert(sessions).values(s);
    },
    async findSession(id) {
      const rows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1);
      return rows[0] ?? null;
    },
    async deleteSession(id) {
      await db.delete(sessions).where(eq(sessions.id, id));
    },
    async deleteExpiredSessions(now) {
      await db.delete(sessions).where(lt(sessions.expiresAt, now));
    },
    async recentFailures(limit) {
      const rows = await db
        .select({ at: loginAttempts.attemptedAt })
        .from(loginAttempts)
        .orderBy(desc(loginAttempts.attemptedAt))
        .limit(limit);
      return rows.map((r) => r.at);
    },
    async insertFailure(at) {
      await db.insert(loginAttempts).values({ attemptedAt: at });
    },
    async deleteFailuresBefore(cutoff) {
      await db
        .delete(loginAttempts)
        .where(lt(loginAttempts.attemptedAt, cutoff));
    },
    async deleteAllFailures() {
      await db.delete(loginAttempts);
    },
    async batch(ops) {
      // Las operaciones se ejecutan en orden; D1 no expone transacciones interactivas.
      for (const op of ops) await op();
    },
  };
}

/** Almacén en memoria para pruebas. */
export function createMemoryStore(): AuthStore & {
  sessions: Map<string, StoredSession>;
  failures: number[];
} {
  const sessionMap = new Map<string, StoredSession>();
  const failures: number[] = [];
  return {
    sessions: sessionMap,
    failures,
    async insertSession(s) {
      sessionMap.set(s.id, { ...s });
    },
    async findSession(id) {
      return sessionMap.get(id) ?? null;
    },
    async deleteSession(id) {
      sessionMap.delete(id);
    },
    async deleteExpiredSessions(now) {
      for (const [id, s] of sessionMap) {
        if (s.expiresAt < now) sessionMap.delete(id);
      }
    },
    async recentFailures(limit) {
      return [...failures].sort((a, b) => b - a).slice(0, limit);
    },
    async insertFailure(at) {
      failures.push(at);
    },
    async deleteFailuresBefore(cutoff) {
      for (let i = failures.length - 1; i >= 0; i--) {
        if (failures[i] < cutoff) failures.splice(i, 1);
      }
    },
    async deleteAllFailures() {
      failures.length = 0;
    },
    async batch(ops) {
      for (const op of ops) await op();
    },
  };
}
