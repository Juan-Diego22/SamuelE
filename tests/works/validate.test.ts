import { describe, expect, it } from "vitest";
import { MESSAGES } from "../../src/lib/works/messages";
import { createMemoryWorksStore } from "../../src/lib/works/store";
import { validateFields } from "../../src/lib/works/validate";

const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";
const store = createMemoryWorksStore();
const base = { id: ID, category: "1", title: "Torta", description: "" };

describe("validateFields", () => {
  it("acepta id, categoría y título; la descripción queda nula", async () => {
    expect(await validateFields(base, store)).toEqual({
      ok: true,
      value: {
        id: ID,
        categoryId: 1,
        title: "Torta",
        description: null,
      },
    });
  });

  it("exige un título: vacío o solo espacios", async () => {
    for (const title of ["", "   "]) {
      expect(await validateFields({ ...base, title }, store)).toEqual({
        ok: false,
        field: "title",
        message: "Escribe un título.",
      });
    }
  });

  it("recorta título y descripción y nulifica la descripción vacía", async () => {
    const r = await validateFields(
      { ...base, title: "  Torta  ", description: "   " },
      store,
    );
    expect(r).toMatchObject({
      ok: true,
      value: { title: "Torta", description: null },
    });
  });

  it("exige un id con formato UUID", async () => {
    expect(await validateFields({ ...base, id: "abc" }, store)).toEqual({
      ok: false,
      field: "form",
      message: MESSAGES.invalidId,
    });
  });

  it("exige una categoría entera que exista", async () => {
    for (const category of ["", "x", "1.5", "99", "0"]) {
      expect(await validateFields({ ...base, category }, store)).toEqual({
        ok: false,
        field: "category",
        message: MESSAGES.categoryMissing,
      });
    }
  });

  it("rechaza título de más de 80 y descripción de más de 1000", async () => {
    expect(
      await validateFields({ ...base, title: "a".repeat(81) }, store),
    ).toEqual({ ok: false, field: "title", message: MESSAGES.titleTooLong });
    expect(
      await validateFields({ ...base, title: "a".repeat(80) }, store),
    ).toMatchObject({ ok: true });
    expect(
      await validateFields({ ...base, description: "a".repeat(1001) }, store),
    ).toEqual({
      ok: false,
      field: "description",
      message: MESSAGES.descriptionTooLong,
    });
  });

  it("conserva <script> como texto sin alterarlo", async () => {
    const title = "<script>alert(1)</script>";
    expect(await validateFields({ ...base, title }, store)).toMatchObject({
      ok: true,
      value: { title },
    });
  });
});
