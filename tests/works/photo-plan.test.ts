import { describe, expect, it } from "vitest";
import { planDerivatives } from "../../src/lib/photo/plan";

describe("planDerivatives", () => {
  it("devuelve los anchos 400, 900 y 1600 conservando la proporción", () => {
    const plan = planDerivatives(4000, 3000, true);
    expect(plan.sizes).toEqual([
      { size: "sm", width: 400, height: 300 },
      { size: "md", width: 900, height: 675 },
      { size: "lg", width: 1600, height: 1200 },
    ]);
  });

  it("nunca agranda una foto pequeña", () => {
    const plan = planDerivatives(700, 500, true);
    expect(plan.sizes.map((s) => s.width)).toEqual([400, 700, 700]);
    expect(plan.sizes[2].height).toBe(500);
  });

  it("elige webp si el navegador lo soporta y jpg si no", () => {
    expect(planDerivatives(2000, 2000, true).ext).toBe("webp");
    expect(planDerivatives(2000, 2000, false).ext).toBe("jpg");
  });

  it("no deja alturas en cero con fotos muy alargadas", () => {
    const plan = planDerivatives(4000, 10, true);
    expect(plan.sizes.every((s) => s.height >= 1)).toBe(true);
  });
});
