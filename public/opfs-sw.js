/* eslint-disable */
// Handler extra que se inyecta (via workbox.importScripts) en el service worker
// generado por vite-plugin-pwa. Sirve los audiolibros guardados en OPFS con
// soporte de HTTP Range, para que <audio> pueda hacer streaming por bytes y
// empezar/saltar al instante en iOS/iPadOS en vez de materializar un blob de
// cientos de MB. Debe mantenerse en sincronía con audiobook-storage.ts:
//   - nombre del archivo en OPFS:  "audiobook-<bookId>"
//   - ruta virtual servida aquí:   "/opfs-audio/<bookId>?type=<mime>"

const OPFS_AUDIO_PREFIX = "/opfs-audio/";

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(OPFS_AUDIO_PREFIX)) return; // deja pasar al resto de Workbox
  const bookId = decodeURIComponent(url.pathname.slice(OPFS_AUDIO_PREFIX.length));
  const mime = url.searchParams.get("type") || "audio/mp4";
  event.respondWith(serveOpfsAudio(event.request, bookId, mime));
});

async function getOpfsAudioFile(bookId) {
  const root = await navigator.storage.getDirectory();
  const fh = await root.getFileHandle("audiobook-" + bookId);
  return await fh.getFile();
}

async function serveOpfsAudio(request, bookId, mime) {
  let file;
  try {
    file = await getOpfsAudioFile(bookId);
  } catch {
    return new Response("Audiobook not found", { status: 404 });
  }

  const size = file.size;
  const range = request.headers.get("Range");

  // Sin Range: entregamos todo el archivo pero anunciando Accept-Ranges para
  // que el navegador pueda pedir rangos en peticiones posteriores.
  if (!range) {
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) {
    return new Response("Malformed Range", {
      status: 416,
      headers: { "Content-Range": "bytes */" + size },
    });
  }

  let start = m[1] === "" ? NaN : parseInt(m[1], 10);
  let end = m[2] === "" ? NaN : parseInt(m[2], 10);

  if (Number.isNaN(start)) {
    // Rango-sufijo "bytes=-N": los últimos N bytes.
    const suffix = Number.isNaN(end) ? 0 : end;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else if (Number.isNaN(end)) {
    end = size - 1;
  }

  if (start > end || start >= size) {
    return new Response("Range Not Satisfiable", {
      status: 416,
      headers: { "Content-Range": "bytes */" + size, "Accept-Ranges": "bytes" },
    });
  }
  end = Math.min(end, size - 1);

  const chunk = file.slice(start, end + 1);
  return new Response(chunk, {
    status: 206,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(end - start + 1),
      "Content-Range": "bytes " + start + "-" + end + "/" + size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
