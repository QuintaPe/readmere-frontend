// Pronunciación: para palabras sueltas en inglés intenta primero el audio
// humano grabado de la Free Dictionary API (gratuita, sin key); si no hay,
// cae a la voz sintética del navegador (Web Speech API).

const PRON_CACHE_KEY = "pron_audio_cache";
const PRON_CACHE_LIMIT = 500;

function readCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PRON_CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

// Se cachean también los fallos ("" = sin audio) para no repetir la petición.
function writeCache(word: string, url: string) {
  try {
    const cache = readCache();
    cache[word] = url;
    const keys = Object.keys(cache);
    if (keys.length > PRON_CACHE_LIMIT) {
      for (const k of keys.slice(0, keys.length - PRON_CACHE_LIMIT))
        delete cache[k];
    }
    localStorage.setItem(PRON_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* best-effort */
  }
}

async function dictionaryAudioUrl(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  const cached = readCache()[key];
  if (cached !== undefined) return cached || null;

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,
    );
    if (!res.ok) {
      writeCache(key, "");
      return null;
    }
    const json = await res.json();
    const url: string =
      json?.[0]?.phonetics?.find(
        (p: { audio?: string }) => p.audio && p.audio.length > 0,
      )?.audio ?? "";
    writeCache(key, url);
    return url || null;
  } catch {
    return null; // sin red: no cachear, puede funcionar más tarde
  }
}

function speakTts(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export function speak(text: string, lang: string) {
  const term = text.trim();
  // Audio de diccionario solo para palabras sueltas en inglés
  const singleEnglishWord =
    lang.toLowerCase().startsWith("en") && /^[a-zA-Z'-]+$/.test(term);

  if (!singleEnglishWord) {
    speakTts(term, lang);
    return;
  }

  void dictionaryAudioUrl(term).then((url) => {
    if (!url) {
      speakTts(term, lang);
      return;
    }
    new Audio(url).play().catch(() => speakTts(term, lang));
  });
}
