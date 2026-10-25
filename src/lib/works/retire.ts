import { UUID } from "./validate";
import type { WorksStore } from "./store";

export interface RetireWorkInput {
  worksStore: WorksStore;
  id: string;
  now: number;
  log?: (message: string) => void;
}

export type RetireWorkResult =
  | { status: "retired" }
  | { status: "not_available" }
  | { status: "unavailable" };

/**
 * Borrado lógico (ADR 0004): solo fija `retired_at`; los archivos de R2 no se tocan.
 * Retirar lo que ya no está disponible no es un error de servidor.
 */
export async function retireWork(
  input: RetireWorkInput,
): Promise<RetireWorkResult> {
  const { worksStore, id, now } = input;
  if (!UUID.test(id)) return { status: "not_available" };
  try {
    const result = await worksStore.retireWork(id, now);
    return result === "retired"
      ? { status: "retired" }
      : { status: "not_available" };
  } catch (error) {
    (input.log ?? (() => {}))(`Falló el retiro del trabajo: ${String(error)}`);
    return { status: "unavailable" };
  }
}
