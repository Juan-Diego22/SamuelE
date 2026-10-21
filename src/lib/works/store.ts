import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { categories, works } from "../../db/schema";

export interface Category {
  id: number;
  name: string;
}

export interface NewWork {
  id: string;
  categoryId: number;
  title: string | null;
  description: string | null;
  photoVersion: number;
  photoExt: string;
  createdAt: number;
}

/** Trabajo con el nombre de su categoría, como lo necesita la lista del panel. */
export interface ListedWork extends NewWork {
  categoryName: string;
}

/** Acceso a datos de trabajos; la lógica no conoce D1 (se prueba con la versión en memoria). */
export interface WorksStore {
  listCategories(): Promise<Category[]>;
  categoryExists(id: number): Promise<boolean>;
  /** `"duplicate"` si el `id` ya existe (reintento idempotente). */
  insertWork(work: NewWork): Promise<"created" | "duplicate">;
  /** Más reciente primero, con la categoría unida. */
  listWorks(limit: number): Promise<ListedWork[]>;
  /** ¿Ya existe un trabajo con este `id`? */
  workExists(id: string): Promise<boolean>;
}

/** Almacén de archivos (R2); la lógica no conoce el binding. */
export interface MediaStore {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(
    key: string,
  ): Promise<{ body: ReadableStream | Uint8Array; contentType: string } | null>;
  delete(keys: string[]): Promise<void>;
}

function isUniqueViolation(error: unknown): boolean {
  // Drizzle envuelve el error de D1 en `cause`; se revisa también el mensaje propio.
  const text = [error, (error as { cause?: unknown })?.cause]
    .map((e) => (e instanceof Error ? e.message : String(e ?? "")))
    .join(" ");
  return /UNIQUE constraint failed|PRIMARY KEY/i.test(text);
}

export function createD1WorksStore(d1: D1Database): WorksStore {
  const db = drizzle(d1);
  return {
    async listCategories() {
      return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(categories.position);
    },
    async categoryExists(id) {
      const rows = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);
      return rows.length > 0;
    },
    async insertWork(work) {
      try {
        await db.insert(works).values(work);
        return "created";
      } catch (error) {
        if (isUniqueViolation(error)) return "duplicate";
        throw error;
      }
    },
    async listWorks(limit) {
      const rows = await db
        .select({
          id: works.id,
          categoryId: works.categoryId,
          title: works.title,
          description: works.description,
          photoVersion: works.photoVersion,
          photoExt: works.photoExt,
          createdAt: works.createdAt,
          categoryName: categories.name,
        })
        .from(works)
        .innerJoin(categories, eq(works.categoryId, categories.id))
        .orderBy(desc(works.createdAt))
        .limit(limit);
      return rows;
    },
    async workExists(id) {
      const rows = await db
        .select({ id: works.id })
        .from(works)
        .where(eq(works.id, id))
        .limit(1);
      return rows.length > 0;
    },
  };
}

export function createR2MediaStore(bucket: R2Bucket): MediaStore {
  return {
    async put(key, bytes, contentType) {
      await bucket.put(key, bytes, { httpMetadata: { contentType } });
    },
    async get(key) {
      const object = await bucket.get(key);
      if (!object) return null;
      return {
        body: object.body,
        contentType:
          object.httpMetadata?.contentType ?? "application/octet-stream",
      };
    },
    async delete(keys) {
      if (keys.length > 0) await bucket.delete(keys);
    },
  };
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: "Tortas" },
  { id: 2, name: "Postres" },
  { id: 3, name: "Rollos" },
  { id: 4, name: "Otros" },
];

/** Almacén en memoria para pruebas; `failInsert` fuerza un fallo al insertar. */
export function createMemoryWorksStore(
  initialCategories: Category[] = DEFAULT_CATEGORIES,
): WorksStore & {
  works: Map<string, NewWork>;
  failInsert: boolean;
  failList: boolean;
} {
  const rows = new Map<string, NewWork>();
  const store = {
    works: rows,
    failInsert: false,
    failList: false,
    async listCategories() {
      return initialCategories.map((c) => ({ ...c }));
    },
    async categoryExists(id: number) {
      return initialCategories.some((c) => c.id === id);
    },
    async insertWork(work: NewWork) {
      if (store.failInsert) throw new Error("fallo forzado de D1");
      if (rows.has(work.id)) return "duplicate" as const;
      rows.set(work.id, { ...work });
      return "created" as const;
    },
    async listWorks(limit: number) {
      if (store.failList) throw new Error("fallo forzado de D1");
      return [...rows.values()]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit)
        .map((w) => ({
          ...w,
          categoryName:
            initialCategories.find((c) => c.id === w.categoryId)?.name ?? "",
        }));
    },
    async workExists(id: string) {
      return rows.has(id);
    },
  };
  return store;
}

/** Almacén de archivos en memoria; `failPutOn` hace fallar la escritura de una clave. */
export function createMemoryMediaStore(): MediaStore & {
  files: Map<string, { bytes: Uint8Array; contentType: string }>;
  failPutOn: string | null;
  failDelete: boolean;
  failGet: boolean;
} {
  const files = new Map<string, { bytes: Uint8Array; contentType: string }>();
  const store = {
    files,
    failPutOn: null as string | null,
    failDelete: false,
    failGet: false,
    async put(key: string, bytes: Uint8Array, contentType: string) {
      if (store.failPutOn !== null && key.includes(store.failPutOn)) {
        throw new Error("fallo forzado de R2");
      }
      files.set(key, { bytes, contentType });
    },
    async get(key: string) {
      if (store.failGet) throw new Error("fallo forzado de R2");
      const file = files.get(key);
      return file ? { body: file.bytes, contentType: file.contentType } : null;
    },
    async delete(keys: string[]) {
      if (store.failDelete) throw new Error("fallo forzado de R2");
      for (const key of keys) files.delete(key);
    },
  };
  return store;
}
