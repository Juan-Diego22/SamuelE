import { describe, expect, it } from "vitest";
import {
  formatPhone,
  generalWhatsappUrl,
  normalizePhone,
  whatsappUrl,
  workMessage,
  workWhatsappUrl,
} from "../../src/lib/catalog/whatsapp";
import { SITE } from "../../src/lib/site/contact";

describe("normalizePhone", () => {
  it("deja solo los dígitos", () => {
    expect(normalizePhone("+57 316 544 1337")).toBe("573165441337");
    expect(normalizePhone("(57) 316-544-1337")).toBe("573165441337");
  });

  it("rechaza números fuera de 8 a 15 dígitos o sin dígitos", () => {
    expect(normalizePhone("1234567")).toBeNull();
    expect(normalizePhone("1234567890123456")).toBeNull();
    expect(normalizePhone("sin número")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
});

describe("formatPhone", () => {
  it("da un formato legible", () => {
    expect(formatPhone("573165441337")).toBe("+57 316 544 1337");
    expect(formatPhone("+57 316 544 1337")).toBe("+57 316 544 1337");
    expect(formatPhone("14155550123")).toBe("+14155550123");
  });
});

describe("mensajes y enlaces", () => {
  it("la frase del trabajo menciona su título", () => {
    expect(workMessage("Torta de Chocolate")).toBe(
      'Hola Samuelé, me interesa el trabajo "Torta de Chocolate". ¿Me puedes dar más información?',
    );
  });

  it("codifica acentos, comillas, & , # y emojis", () => {
    const text = 'Torta "Mamá" & más #1 🎂';
    const url = whatsappUrl("+57 316 544 1337", text);
    expect(url.startsWith("https://wa.me/573165441337?text=")).toBe(true);
    const query = url.split("?text=")[1];
    expect(query).not.toMatch(/[ "&#]/);
    expect(decodeURIComponent(query)).toBe(text);
  });

  it("un número inválido falla de forma visible", () => {
    expect(() => whatsappUrl("123", "hola")).toThrow(/no válido/);
  });

  it("los enlaces del sitio usan el número configurado", () => {
    expect(generalWhatsappUrl()).toBe(
      `https://wa.me/${normalizePhone(SITE.whatsapp)}?text=${encodeURIComponent(SITE.messages.general)}`,
    );
    expect(workWhatsappUrl("Brownies")).toContain(
      encodeURIComponent('"Brownies"'),
    );
  });
});

describe("configuración del sitio", () => {
  it("el número configurado es válido (FR-021)", () => {
    expect(normalizePhone(SITE.whatsapp)).not.toBeNull();
  });

  it("no incluye teléfono aparte, zona ni anticipación (FR-019)", () => {
    const text = JSON.stringify(SITE).toLowerCase();
    expect(text).not.toMatch(/tel[eé]fono|zona|anticipaci/);
  });
});
