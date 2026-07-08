import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { translateWord, fetchBookMetadata } from "./ai.functions";

// Minimal in-memory localStorage so the translation cache has somewhere to live.
function installLocalStorage(seed: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(seed));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
  return store;
}

function geminiReply(obj: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }],
    }),
  };
}

beforeEach(() => {
  // No AI key from the environment unless a test opts in.
  vi.stubEnv("VITE_GEMINI_API_KEY", "");
  vi.stubEnv("VITE_GROQ_API_KEY", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("translateWord caching", () => {
  it("calls the AI once and serves the second lookup from cache", async () => {
    installLocalStorage({ gemini_api_key: "test-key" });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        geminiReply({ translation: "correr", definition: "moverse rápido" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const first = await translateWord({
      data: { term: "run", sourceLanguage: "en", targetLanguage: "es" },
    });
    expect(first.translation).toBe("correr");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await translateWord({
      data: { term: "run", sourceLanguage: "en", targetLanguage: "es" },
    });
    expect(second.translation).toBe("correr");
    // Still 1 — the second lookup was served from cache, no extra AI call.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not cache context-sensitive (multi-word or contextual) lookups", async () => {
    installLocalStorage({ gemini_api_key: "test-key" });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(geminiReply({ translation: "dar por sentado" }));
    vi.stubGlobal("fetch", fetchMock);

    await translateWord({
      data: { term: "take for granted", sourceLanguage: "en", targetLanguage: "es" },
    });
    await translateWord({
      data: { term: "take for granted", sourceLanguage: "en", targetLanguage: "es" },
    });
    // Multi-word expression → always re-queried.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("fetchBookMetadata Open Library fallback", () => {
  it("returns metadata from Open Library when no AI key is present", async () => {
    installLocalStorage();
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("search.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            docs: [
              { first_publish_year: 1949, subject: ["Dystopia"], key: "/works/OL1W" },
            ],
          }),
        });
      }
      // Work description endpoint.
      return Promise.resolve({
        ok: true,
        json: async () => ({ description: "A dystopian novel." }),
      });
    });
    vi.stubGlobal("fetch", fetchMock as never);

    const meta = await fetchBookMetadata({ title: "1984", author: "Orwell" });
    expect(meta).not.toBeNull();
    expect(meta!.publishedYear).toBe(1949);
    expect(meta!.genre).toBe("Dystopia");
    expect(meta!.synopsis).toBe("A dystopian novel.");
  });

  it("returns null when Open Library has nothing", async () => {
    installLocalStorage();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) }),
    );
    const meta = await fetchBookMetadata({ title: "asdkjfhaskjdfh", author: null });
    expect(meta).toBeNull();
  });
});
