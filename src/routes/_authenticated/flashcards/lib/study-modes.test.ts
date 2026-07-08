import { describe, it, expect } from "vitest";
import {
  clozeSentence,
  normalizeAnswer,
  effectiveMode,
} from "./study-modes";
import type { Word } from "@/types";

describe("clozeSentence", () => {
  it("blanks the term inside the sentence", () => {
    expect(clozeSentence("The cat sat on the mat.", "cat")).toBe(
      "The _____ sat on the mat.",
    );
  });

  it("is case-insensitive and matches inflected forms", () => {
    expect(clozeSentence("Running fast, he ran.", "run")).toBe(
      "_____ fast, he ran.",
    );
  });

  it("returns null when the term is not in the sentence", () => {
    expect(clozeSentence("Nothing to see here.", "cat")).toBeNull();
  });

  it("escapes regex special characters in the term", () => {
    // Antes: `.not.toThrow` sin invocar — la aserción no comprobaba nada.
    expect(() => clozeSentence("It costs $5 (aprox).", "(aprox)")).not.toThrow();
    expect(clozeSentence("no match", "a+b")).toBeNull();
  });
});

describe("normalizeAnswer", () => {
  it("ignores case, accents and extra whitespace", () => {
    expect(normalizeAnswer("  Árbol  Grande ")).toBe("arbol grande");
    expect(normalizeAnswer("arbol grande")).toBe("arbol grande");
  });
});

describe("effectiveMode", () => {
  const base = {
    term: "cat",
    translation: "gato",
    example: "The cat sat.",
  } as Word;

  it("keeps cloze when the example contains the term", () => {
    expect(effectiveMode(base, "cloze")).toBe("cloze");
  });

  it("falls back to normal for cloze without usable example", () => {
    expect(effectiveMode({ ...base, example: null } as Word, "cloze")).toBe(
      "normal",
    );
    expect(
      effectiveMode({ ...base, example: "unrelated text" } as Word, "cloze"),
    ).toBe("normal");
  });

  it("falls back to normal for reverse/typing without translation", () => {
    const noTrans = { ...base, translation: null } as Word;
    expect(effectiveMode(noTrans, "reverse")).toBe("normal");
    expect(effectiveMode(noTrans, "typing")).toBe("normal");
    expect(effectiveMode(base, "reverse")).toBe("reverse");
  });
});
