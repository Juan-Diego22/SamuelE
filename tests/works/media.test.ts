import { describe, expect, it } from "vitest";
import {
  hasMetadata,
  sniffImageType,
  validateDerivatives,
  validateOriginal,
} from "../../src/lib/works/media";
import { MESSAGES } from "../../src/lib/works/messages";
import {
  MAX_DERIVATIVE_BYTES,
  MAX_ORIGINAL_BYTES,
} from "../../src/lib/works/limits";

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));
const le32 = (n: number) => [
  n & 255,
  (n >> 8) & 255,
  (n >> 16) & 255,
  n >>> 24,
];

/** JPEG mínimo: SOI, segmentos indicados, SOS y EOI. */
function jpeg(...segments: Array<[number, number[]]>): Uint8Array {
  const out = [0xff, 0xd8];
  for (const [marker, payload] of segments) {
    const length = payload.length + 2;
    out.push(0xff, marker, length >> 8, length & 255, ...payload);
  }
  out.push(0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0xff, 0xd9);
  return new Uint8Array(out);
}

/** WebP mínimo con los bloques indicados. */
function webp(...chunks: Array<[string, number[]]>): Uint8Array {
  const body = [...ascii("WEBP")];
  for (const [fourcc, payload] of chunks) {
    body.push(...ascii(fourcc), ...le32(payload.length), ...payload);
    if (payload.length % 2) body.push(0);
  }
  return new Uint8Array([...ascii("RIFF"), ...le32(body.length), ...body]);
}

const cleanJpeg = () => jpeg([0xe0, ascii("JFIF\0")]);
const exifJpeg = () => jpeg([0xe1, [...ascii("Exif\0\0"), 1, 2, 3, 4]]);
const cleanWebp = () => webp(["VP8 ", [1, 2, 3, 4]]);
const exifWebp = () => webp(["VP8 ", [1, 2, 3, 4]], ["EXIF", [9, 9]]);
const xmpWebp = () => webp(["VP8X", new Array(10).fill(0)], ["XMP ", [9, 9]]);
const png = () =>
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe("sniffImageType", () => {
  it("reconoce JPEG, PNG y WebP por sus bytes", () => {
    expect(sniffImageType(cleanJpeg())).toBe("jpeg");
    expect(sniffImageType(png())).toBe("png");
    expect(sniffImageType(cleanWebp())).toBe("webp");
  });

  it("rechaza PDF, HEIC y texto con extensión de imagen", () => {
    expect(sniffImageType(new Uint8Array(ascii("%PDF-1.7 ....")))).toBeNull();
    const heic = new Uint8Array([
      0,
      0,
      0,
      24,
      ...ascii("ftypheic"),
      0,
      0,
      0,
      0,
    ]);
    expect(sniffImageType(heic)).toBeNull();
    expect(
      sniffImageType(new Uint8Array(ascii("hola, esto es texto"))),
    ).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
});

describe("hasMetadata", () => {
  it("detecta EXIF en un JPEG (APP1) y APP13", () => {
    expect(hasMetadata(exifJpeg(), "jpeg")).toBe(true);
    expect(hasMetadata(jpeg([0xed, [1, 2, 3]]), "jpeg")).toBe(true);
  });

  it("detecta EXIF y XMP en un WebP", () => {
    expect(hasMetadata(exifWebp(), "webp")).toBe(true);
    expect(hasMetadata(xmpWebp(), "webp")).toBe(true);
  });

  it("acepta un JPEG y un WebP limpios", () => {
    expect(hasMetadata(cleanJpeg(), "jpeg")).toBe(false);
    expect(hasMetadata(cleanWebp(), "webp")).toBe(false);
  });
});

describe("validateOriginal", () => {
  it("acepta JPEG, PNG y WebP", () => {
    expect(validateOriginal(exifJpeg())).toEqual({ ok: true, type: "jpeg" });
    expect(validateOriginal(png())).toEqual({ ok: true, type: "png" });
    expect(validateOriginal(cleanWebp())).toEqual({ ok: true, type: "webp" });
  });

  it("exige la foto", () => {
    expect(validateOriginal(undefined)).toEqual({
      ok: false,
      field: "original",
      message: MESSAGES.photoMissing,
    });
    expect(validateOriginal(new Uint8Array())).toMatchObject({
      ok: false,
      message: MESSAGES.photoMissing,
    });
  });

  it("rechaza más de 15 MB", () => {
    const big = new Uint8Array(MAX_ORIGINAL_BYTES + 1);
    big.set(cleanJpeg());
    expect(validateOriginal(big)).toEqual({
      ok: false,
      field: "original",
      message: MESSAGES.photoTooLarge,
    });
  });

  it("rechaza tipos no admitidos", () => {
    expect(validateOriginal(new Uint8Array(ascii("%PDF-1.7 ...")))).toEqual({
      ok: false,
      field: "original",
      message: MESSAGES.photoFormat,
    });
  });
});

describe("validateDerivatives", () => {
  it("acepta tres WebP limpios", () => {
    expect(
      validateDerivatives({
        sm: cleanWebp(),
        md: cleanWebp(),
        lg: cleanWebp(),
      }),
    ).toEqual({ ok: true, ext: "webp" });
  });

  it("acepta tres JPEG limpios", () => {
    expect(
      validateDerivatives({
        sm: cleanJpeg(),
        md: cleanJpeg(),
        lg: cleanJpeg(),
      }),
    ).toEqual({ ok: true, ext: "jpg" });
  });

  const invalid = {
    ok: false,
    field: "photo",
    message: MESSAGES.derivativesInvalid,
  };

  it("exige las tres", () => {
    expect(
      validateDerivatives({ sm: cleanWebp(), md: cleanWebp(), lg: undefined }),
    ).toEqual(invalid);
  });

  it("rechaza una derivada de más de 1 MB", () => {
    const big = new Uint8Array(MAX_DERIVATIVE_BYTES + 1);
    big.set(cleanWebp());
    expect(
      validateDerivatives({ sm: cleanWebp(), md: cleanWebp(), lg: big }),
    ).toEqual(invalid);
  });

  it("rechaza mezclar WebP con JPEG", () => {
    expect(
      validateDerivatives({
        sm: cleanWebp(),
        md: cleanJpeg(),
        lg: cleanWebp(),
      }),
    ).toEqual(invalid);
  });

  it("rechaza PNG y archivos que no son imagen", () => {
    expect(validateDerivatives({ sm: png(), md: png(), lg: png() })).toEqual(
      invalid,
    );
  });

  it("rechaza derivadas con metadatos", () => {
    expect(
      validateDerivatives({ sm: exifJpeg(), md: cleanJpeg(), lg: cleanJpeg() }),
    ).toEqual(invalid);
    expect(
      validateDerivatives({ sm: cleanWebp(), md: exifWebp(), lg: cleanWebp() }),
    ).toEqual(invalid);
  });
});
