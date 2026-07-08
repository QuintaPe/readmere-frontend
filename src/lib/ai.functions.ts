interface BookMetadataInput {
  title: string;
  author?: string | null;
}

export interface BookMetadata {
  synopsis: string;
  genre: string;
  publishedYear: number | null;
}

// ── Proveedores de IA ────────────────────────────────────────────────────────
// Solo puede haber UNO configurado a la vez (localStorage: ai_provider +
// ai_api_key). Casi todos exponen una API compatible con OpenAI, así que basta
// con baseUrl + model; Gemini y Anthropic tienen su propio protocolo.

export type AiProviderKind = "openai" | "gemini" | "anthropic";

export interface AiProviderDef {
  id: string;
  label: string;
  kind: AiProviderKind;
  model: string;
  /** Solo para kind "openai": raíz de la API (sin /chat/completions). */
  baseUrl?: string;
  /** Dónde conseguir la clave. */
  keyUrl: string;
  placeholder: string;
  /** Apunte corto para la UI: "gratis", "de pago"... */
  note?: string;
}

export const AI_PROVIDERS: AiProviderDef[] = [
  {
    id: "groq",
    label: "Groq",
    kind: "openai",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    keyUrl: "https://console.groq.com/keys",
    placeholder: "gsk_...",
    note: "gratis y rápido (recomendado)",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    kind: "gemini",
    model: "gemini-2.5-flash",
    keyUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIza...",
    note: "gratis",
  },
  {
    id: "cerebras",
    label: "Cerebras",
    kind: "openai",
    baseUrl: "https://api.cerebras.ai/v1",
    model: "llama-3.3-70b",
    keyUrl: "https://cloud.cerebras.ai",
    placeholder: "csk-...",
    note: "gratis",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    kind: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "cohere/north-mini-code:free",
    keyUrl: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
    note: "muchos modelos",
  },
  {
    id: "openai",
    label: "OpenAI",
    kind: "openai",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    keyUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
    note: "de pago",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    kind: "anthropic",
    model: "claude-haiku-4-5-20251001",
    keyUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
    note: "de pago",
  },
  {
    id: "mistral",
    label: "Mistral",
    kind: "openai",
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-small-latest",
    keyUrl: "https://console.mistral.ai/api-keys",
    placeholder: "...",
    note: "tiene capa gratis",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    kind: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    keyUrl: "https://platform.deepseek.com/api_keys",
    placeholder: "sk-...",
    note: "de pago (barato)",
  },
  {
    id: "together",
    label: "Together AI",
    kind: "openai",
    baseUrl: "https://api.together.xyz/v1",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    keyUrl: "https://api.together.ai/settings/api-keys",
    placeholder: "...",
    note: "de pago",
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    kind: "openai",
    baseUrl: "https://api.x.ai/v1",
    model: "grok-3-mini",
    keyUrl: "https://console.x.ai",
    placeholder: "xai-...",
    note: "de pago",
  },
];

function getAiProvider(): { def: AiProviderDef; apiKey: string } | null {
  const id = localStorage.getItem("ai_provider");
  const key = localStorage.getItem("ai_api_key");
  if (id && key) {
    const def = AI_PROVIDERS.find((p) => p.id === id);
    if (def) return { def, apiKey: key };
  }
  // Compatibilidad: claves del formato antiguo (dos campos) y del build.
  const groqKey = localStorage.getItem("groq_api_key") || import.meta.env.VITE_GROQ_API_KEY;
  if (groqKey) return { def: AI_PROVIDERS[0], apiKey: groqKey };
  const geminiKey = localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiKey) return { def: AI_PROVIDERS[1], apiKey: geminiKey };
  return null;
}

/** Proveedor de IA activo (id), o null si no hay ninguna clave configurada.
 * La UI lo usa para explicar por qué no hay traducciones en vez de fallar
 * en silencio. */
export function activeAiProvider(): string | null {
  return getAiProvider()?.def.id ?? null;
}

/** Algunos modelos envuelven el JSON en ```json ... ``` aunque se les pida
 * JSON estricto; el parseo de los llamadores hace JSON.parse directo. */
function extractJson(text: string): string {
  const t = text.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : t;
}

async function callAi(prompt: string): Promise<string> {
  const ai = getAiProvider();
  if (!ai) throw new Error("AI no configurada. Añade tu clave API en los Ajustes.");
  const { def, apiKey } = ai;

  let res: Response;
  if (def.kind === "gemini") {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${def.model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
  } else if (def.kind === "anthropic") {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // Necesario para llamar a la API de Anthropic desde el navegador.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: def.model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } else {
    // API compatible con OpenAI (Groq, OpenAI, Mistral, DeepSeek, etc.)
    res = await fetch(`${def.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: def.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });
  }

  if (res.status === 429) throw new Error("Demasiadas solicitudes, intenta más tarde");
  if (res.status === 401 || res.status === 403)
    throw new Error("Clave API inválida. Revisa los Ajustes.");
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const json = await res.json();

  if (def.kind === "gemini")
    return extractJson(json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
  if (def.kind === "anthropic")
    return extractJson(json.content?.[0]?.text ?? "{}");
  return extractJson(json.choices?.[0]?.message?.content ?? "{}");
}

// Free, key-less fallback via Open Library. Used when there is no AI key or the
// AI response is missing fields, so books still get a year/genre/synopsis.
async function fetchOpenLibraryMetadata({
  title,
  author,
}: BookMetadataInput): Promise<Partial<BookMetadata>> {
  try {
    const params = new URLSearchParams({
      title,
      limit: "1",
      fields: "first_publish_year,subject,key",
    });
    if (author) params.set("author", author);
    const res = await fetch(`https://openlibrary.org/search.json?${params}`);
    if (!res.ok) return {};
    const json = await res.json();
    const doc = json.docs?.[0];
    if (!doc) return {};

    const out: Partial<BookMetadata> = {};
    if (typeof doc.first_publish_year === "number")
      out.publishedYear = doc.first_publish_year;
    if (Array.isArray(doc.subject) && doc.subject.length)
      out.genre = doc.subject[0];

    // Work description lives on the work record, not in search results.
    if (doc.key) {
      try {
        const wr = await fetch(`https://openlibrary.org${doc.key}.json`);
        if (wr.ok) {
          const work = await wr.json();
          const desc =
            typeof work.description === "string"
              ? work.description
              : work.description?.value;
          if (desc) out.synopsis = String(desc).split("\n")[0].slice(0, 400);
        }
      } catch {
        /* description is optional */
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function fetchBookMetadata({
  title,
  author,
}: BookMetadataInput): Promise<BookMetadata | null> {
  let ai: Partial<BookMetadata> = {};

  if (getAiProvider()) {
    const prompt = `Eres una base de datos literaria. Para el libro titulado "${title}"${author ? ` de ${author}` : ""}, devuelve JSON estricto con:
{"synopsis":"<sinopsis breve en español, 2-3 frases>","genre":"<género literario principal en español, ej: Fantasía épica, Ciencia ficción, Romance, Thriller>","publishedYear":<año de publicación original como número entero, o null si no lo sabes>}.
Responde SOLO el JSON, sin markdown.`;
    try {
      const parsed = JSON.parse(await callAi(prompt));
      ai = {
        synopsis: parsed.synopsis || undefined,
        genre: parsed.genre || undefined,
        publishedYear: parsed.publishedYear ?? undefined,
      };
    } catch {
      /* fall through to Open Library */
    }
  }

  // Fill any gaps (or provide everything when there is no AI key) from Open Library.
  const needsFallback =
    !ai.synopsis || !ai.genre || ai.publishedYear == null;
  const ol = needsFallback
    ? await fetchOpenLibraryMetadata({ title, author })
    : {};

  const merged: BookMetadata = {
    synopsis: ai.synopsis ?? ol.synopsis ?? "",
    genre: ai.genre ?? ol.genre ?? "",
    publishedYear: ai.publishedYear ?? ol.publishedYear ?? null,
  };

  if (!merged.synopsis && !merged.genre && merged.publishedYear == null)
    return null;
  return merged;
}

/**
 * Uses AI to map audio chapter titles to EPUB chapter indices.
 * Returns a2e: number[] where a2e[audioIdx] = epubIdx (-1 if no match).
 */
export async function mapChaptersByAI(
  audioTitles: string[],
  epubTitles: string[],
): Promise<{ map: number[]; titles: string[] }> {
  const prompt = `Tengo dos listas de capítulos de un audiolibro y su versión en EPUB.
Tu tarea: para cada capítulo de audio (lista A):
1. Indica el índice (0-based) del capítulo de EPUB (lista B) al que mejor corresponde.
2. Elige el mejor título para ese capítulo: si el título del EPUB es más descriptivo o limpio que el del audio, úsalo; si no, usa el del audio.

Lista A (audio, ${audioTitles.length} capítulos):
${audioTitles.map((t, i) => `${i}: ${t}`).join("\n")}

Lista B (epub, ${epubTitles.length} capítulos):
${epubTitles.map((t, i) => `${i}: ${t}`).join("\n")}

Responde SOLO con JSON estricto: {"map": [<epubIdx para audio[0]>, ...], "titles": ["<mejor título para audio[0]>", ...]}
Usa -1 en map si no hay correspondencia. Ambos arrays deben tener longitud ${audioTitles.length}.`;

  try {
    const content = await callAi(prompt);
    const parsed = JSON.parse(content);
    const map: number[] = parsed.map;
    const titles: string[] = parsed.titles;
    if (!Array.isArray(map) || map.length !== audioTitles.length) return { map: [], titles: [] };
    return {
      map: map.map((v) => (typeof v === "number" ? v : -1)),
      titles: Array.isArray(titles) ? titles.map((t, i) => (typeof t === "string" && t ? t : audioTitles[i])) : audioTitles,
    };
  } catch {
    return { map: [], titles: [] };
  }
}

interface TranslateInput {
  term: string;
  context?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface TranslateResult {
  translation: string;
  definition: string;
  example: string;
  lemma: string;
  phonetic: string;
  partOfSpeech: string;
  synonyms: string;
  difficulty: string;
}

// Local cache so re-looking-up a word never costs an extra AI call. Keyed by
// language + term; context is ignored on purpose (the base entry is reusable).
const CACHE_KEY = "translation_cache";
const CACHE_LIMIT = 1000;

function cacheKey(term: string, lang?: string): string {
  return `${lang ?? "en"}:${term.trim().toLowerCase()}`;
}

function readCache(): Record<string, TranslateResult> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeCache(key: string, value: TranslateResult) {
  try {
    const cache = readCache();
    cache[key] = value;
    // Evict oldest-ish entries if the cache grows unbounded.
    const keys = Object.keys(cache);
    if (keys.length > CACHE_LIMIT) {
      for (const k of keys.slice(0, keys.length - CACHE_LIMIT)) delete cache[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* localStorage full or unavailable — ignore, caching is best-effort */
  }
}

export interface EnrichCandidate {
  id: string;
  term: string;
  language: string;
  translation?: string | null;
  definition?: string | null;
  example?: string | null;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  synonyms?: string | null;
  difficulty?: string | null;
}

// Campos que el enriquecimiento puede rellenar (solo cuando están vacíos).
const ENRICH_FIELDS = [
  "translation",
  "definition",
  "example",
  "phonetic",
  "partOfSpeech",
  "synonyms",
  "difficulty",
] as const;
type EnrichField = (typeof ENRICH_FIELDS)[number];

export function missingEnrichFields(w: EnrichCandidate): EnrichField[] {
  return ENRICH_FIELDS.filter((f) => !w[f]);
}

/**
 * Completa en una sola llamada de IA los campos vacíos de varias palabras.
 * Devuelve, por id, SOLO los campos que estaban vacíos y la IA pudo rellenar.
 */
export async function enrichWordsBatch(
  words: EnrichCandidate[],
  targetLanguage: string,
): Promise<Record<string, Partial<Record<EnrichField, string>>>> {
  const pending = words
    .map((w) => ({ word: w, missing: missingEnrichFields(w) }))
    .filter((e) => e.missing.length > 0);
  if (!pending.length) return {};

  const list = pending
    .map(
      (e, i) =>
        `${i}: "${e.word.term}" (idioma: ${e.word.language}; faltan: ${e.missing.join(", ")})`,
    )
    .join("\n");

  const prompt = `Eres un diccionario bilingüe experto. Para cada palabra de la lista, devuelve sus datos léxicos. Traducciones y definiciones en ${targetLanguage}; ejemplos y sinónimos en el idioma original de la palabra.
Lista (${pending.length} palabras):
${list}

Responde SOLO JSON estricto con la forma:
{"words":[{"i":<índice de la lista>,"translation":"...","definition":"<1 frase>","example":"<frase natural con la palabra>","phonetic":"<IPA>","partOfSpeech":"<en español: verbo, sustantivo...>","synonyms":"<3-4 separados por coma>","difficulty":"<A1|A2|B1|B2|C1|C2>"}]}
Incluye una entrada por cada índice de la lista.`;

  const parsed = JSON.parse(await callAi(prompt));
  const out: Record<string, Partial<Record<EnrichField, string>>> = {};
  if (!Array.isArray(parsed.words)) return out;

  for (const row of parsed.words) {
    const entry = pending[row?.i];
    if (!entry) continue;
    const fill: Partial<Record<EnrichField, string>> = {};
    for (const f of entry.missing) {
      if (typeof row[f] === "string" && row[f].trim()) fill[f] = row[f].trim();
    }
    if (Object.keys(fill).length) out[entry.word.id] = fill;
  }
  return out;
}

export async function translateWord({
  data,
}: {
  data: TranslateInput;
}): Promise<TranslateResult> {
  // A single-word lookup with no context is safe to serve from cache; multi-word
  // expressions or context-sensitive lookups always hit the AI for accuracy.
  const cacheable = !data.context && data.term.trim().split(/\s+/).length === 1;
  const key = cacheKey(data.term, data.sourceLanguage);

  if (cacheable) {
    const hit = readCache()[key];
    if (hit && hit.translation) return hit;
  }

  const prompt = `Eres un diccionario bilingüe experto. Para la palabra o expresión "${data.term}" en ${data.sourceLanguage}, devuelve JSON estricto con la forma:
{"translation":"<traducción breve a ${data.targetLanguage}>","definition":"<definición en ${data.targetLanguage}, 1 frase>","example":"<frase de ejemplo natural en ${data.sourceLanguage}>","lemma":"<forma base del diccionario, ej: run para running>","phonetic":"<transcripción fonética IPA, ej: /prɪˈtɛnd/>","partOfSpeech":"<categoría gramatical en español: verbo, sustantivo, adjetivo, adverbio, etc.>","synonyms":"<3-4 sinónimos en ${data.sourceLanguage} separados por coma, o cadena vacía>","difficulty":"<nivel CEFR: A1, A2, B1, B2, C1 o C2>"}.
${data.context ? `Contexto donde aparece: "${data.context}". Adapta la traducción a ese contexto.` : ""}
Responde SOLO el JSON, sin markdown.`;

  try {
    const content = await callAi(prompt);
    const parsed = JSON.parse(content);
    const result: TranslateResult = {
      translation: parsed.translation ?? "",
      definition: parsed.definition ?? "",
      example: parsed.example ?? "",
      lemma: parsed.lemma ?? data.term,
      phonetic: parsed.phonetic ?? "",
      partOfSpeech: parsed.partOfSpeech ?? "",
      synonyms: parsed.synonyms ?? "",
      difficulty: parsed.difficulty ?? "",
    };
    if (cacheable && result.translation) writeCache(key, result);
    return result;
  } catch {
    return {
      translation: "",
      definition: "",
      example: "",
      lemma: data.term,
      phonetic: "",
      partOfSpeech: "",
      synonyms: "",
      difficulty: "",
    };
  }
}
