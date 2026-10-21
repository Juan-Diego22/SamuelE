import { describe, expect, it } from "vitest";
import { derivativeKey, mediaUrl, originalKey } from "../../src/lib/works/keys";

const ID = "3f2b8c1e-7a4d-4e0b-9c55-0a1b2c3d4e5f";

describe("claves de R2", () => {
  it("la original va en originals/ como jpg", () => {
    expect(originalKey(ID, 1)).toBe(`originals/${ID}-1.jpg`);
  });

  it("las derivadas llevan tamaño y extensión", () => {
    expect(derivativeKey(ID, 1, "sm", "webp")).toBe(`works/${ID}-1/sm.webp`);
    expect(derivativeKey(ID, 2, "lg", "jpg")).toBe(`works/${ID}-2/lg.jpg`);
  });

  it("la URL pública cuelga de /media", () => {
    expect(mediaUrl(ID, 1, "md", "webp")).toBe(`/media/works/${ID}-1/md.webp`);
    expect(mediaUrl(ID, 1, "md", "jpg")).toBe(`/media/works/${ID}-1/md.jpg`);
  });
});
