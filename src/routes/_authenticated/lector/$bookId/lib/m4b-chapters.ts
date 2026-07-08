export const CHAPTERS_PARSER_VERSION = 6;

export type AudioChapter = { title: string; startTime: number };

type Box = { type: string; body: number; end: number; children: Box[] };

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "udta", "tref"]);
const UTF8 = new TextDecoder("utf-8");

function str4(v: DataView, p: number): string {
  return String.fromCharCode(v.getUint8(p), v.getUint8(p + 1), v.getUint8(p + 2), v.getUint8(p + 3));
}

function clean(s: string): string {
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s.replace(/\0+$/, "").trim();
}

function boxes(v: DataView, start: number, end: number, depth = 0): Box[] {
  const out: Box[] = [];
  let p = start;
  while (p + 8 <= end) {
    let size = v.getUint32(p);
    let hs = 8;
    const type = str4(v, p + 4);
    if (size === 1) {
      if (p + 16 > end) break;
      size = Number(v.getBigUint64(p + 8));
      hs = 16;
    } else if (size === 0) {
      size = end - p;
    }
    if (size < hs || p + size > end) break;
    const b: Box = { type, body: p + hs, end: p + size, children: [] };
    if (CONTAINERS.has(type) && depth < 8) b.children = boxes(v, b.body, b.end, depth + 1);
    out.push(b);
    p += size;
  }
  return out;
}

function find(bs: Box[], type: string): Box | null {
  for (const b of bs) {
    if (b.type === type) return b;
    const f = find(b.children, type);
    if (f) return f;
  }
  return null;
}

function kid(b: Box, type: string): Box | null {
  return b.children.find((c) => c.type === type) ?? null;
}

function fromChpl(v: DataView, b: Box): AudioChapter[] {
  let p = b.body;
  const version = v.getUint8(p); p += 4;
  if (version !== 0) p += 4;
  const count = v.getUint8(p); p += 1;
  const out: AudioChapter[] = [];
  for (let i = 0; i < count && p + 9 <= b.end; i++) {
    const start = Number(v.getBigUint64(p)) / 1e7; p += 8;
    const len = v.getUint8(p); p += 1;
    if (p + len > b.end) break;
    const title = clean(UTF8.decode(new Uint8Array(v.buffer, v.byteOffset + p, len))); p += len;
    out.push({ title: title || `Capítulo ${i + 1}`, startTime: start });
  }
  return out;
}

type Samples = { timescale: number; starts: number[]; offsets: number[]; sizes: number[] };

function readTable(v: DataView, box: Box | null, read: (p: number) => void, stride: number): void {
  if (!box) return;
  let p = box.body + 4;
  const n = v.getUint32(p); p += 4;
  for (let i = 0; i < n && p + stride <= box.end; i++) { read(p); p += stride; }
}

function textSamples(v: DataView, trak: Box): Samples | null {
  const mdhd = find(trak.children, "mdhd");
  const stbl = find(trak.children, "stbl");
  if (!mdhd || !stbl) return null;
  const timescale = v.getUint32(mdhd.body + (v.getUint8(mdhd.body) === 1 ? 20 : 12)) || 1000;

  const starts: number[] = [];
  let t = 0;
  readTable(v, kid(stbl, "stts"), (p) => {
    const count = v.getUint32(p), delta = v.getUint32(p + 4);
    for (let j = 0; j < count; j++) { starts.push(t); t += delta; }
  }, 8);

  const sizes: number[] = [];
  const stsz = kid(stbl, "stsz");
  if (stsz) {
    const fixed = v.getUint32(stsz.body + 4);
    const n = v.getUint32(stsz.body + 8);
    let p = stsz.body + 12;
    for (let i = 0; i < n; i++) { sizes.push(fixed || v.getUint32(p)); if (!fixed) p += 4; }
  }

  const chunks: number[] = [];
  const co64 = kid(stbl, "co64");
  readTable(v, kid(stbl, "stco") ?? co64, (p) => {
    chunks.push(co64 ? Number(v.getBigUint64(p)) : v.getUint32(p));
  }, co64 ? 8 : 4);

  const stsc: [number, number][] = [];
  readTable(v, kid(stbl, "stsc"), (p) => stsc.push([v.getUint32(p), v.getUint32(p + 4)]), 12);

  const offsets: number[] = [];
  let si = 0;
  for (let c = 0; c < chunks.length && si < sizes.length; c++) {
    let spc = 1;
    for (let e = stsc.length - 1; e >= 0; e--) if (stsc[e][0] <= c + 1) { spc = stsc[e][1]; break; }
    let off = chunks[c];
    for (let s = 0; s < spc && si < sizes.length; s++) { offsets[si] = off; off += sizes[si]; si++; }
  }

  if (!starts.length || !sizes.length || !offsets.length) return null;
  return { timescale, starts, offsets, sizes };
}

async function fromText(file: File, s: Samples): Promise<AudioChapter[]> {
  const n = Math.min(s.starts.length, s.offsets.length, s.sizes.length);
  if (!n) return [];
  let lo = Infinity, hi = 0;
  for (let i = 0; i < n; i++) { lo = Math.min(lo, s.offsets[i]); hi = Math.max(hi, s.offsets[i] + s.sizes[i]); }
  const bulk = hi - lo > 0 && hi - lo <= 8 * 1024 * 1024
    ? new DataView(await file.slice(lo, hi).arrayBuffer())
    : null;

  const out: AudioChapter[] = [];
  for (let i = 0; i < n; i++) {
    const bytes = bulk
      ? new Uint8Array(bulk.buffer, s.offsets[i] - lo, s.sizes[i])
      : new Uint8Array(await file.slice(s.offsets[i], s.offsets[i] + s.sizes[i]).arrayBuffer());
    const len = bytes.length >= 2 ? (bytes[0] << 8) | bytes[1] : 0;
    const title = clean(UTF8.decode(bytes.subarray(2, Math.min(2 + len, bytes.length))));
    out.push({ title: title || `Capítulo ${i + 1}`, startTime: s.starts[i] / s.timescale });
  }
  return out;
}

function chapterTrak(v: DataView, moov: Box): Box | null {
  const traks = moov.children.filter((c) => c.type === "trak");
  const ids = new Set<number>();
  for (const trak of traks) {
    const chap = find(trak.children, "chap");
    if (chap) for (let p = chap.body; p + 4 <= chap.end; p += 4) ids.add(v.getUint32(p));
  }
  let fallback: Box | null = null;
  for (const trak of traks) {
    const hdlr = find(trak.children, "hdlr");
    if (!hdlr || str4(v, hdlr.body + 8) !== "text") continue;
    fallback ??= trak;
    const tkhd = kid(trak, "tkhd");
    const id = tkhd ? v.getUint32(tkhd.body + (v.getUint8(tkhd.body) === 1 ? 20 : 12)) : -1;
    if (ids.has(id)) return trak;
  }
  return fallback;
}

async function findMoov(file: File): Promise<{ offset: number; size: number } | null> {
  const CHUNK = 4 * 1024 * 1024;
  const scan = (v: DataView, base: number) => {
    let p = 0, afterMdat = -1;
    while (p + 8 <= v.byteLength) {
      let size = v.getUint32(p);
      const type = str4(v, p + 4);
      if (size === 1) { if (p + 16 > v.byteLength) break; size = Number(v.getBigUint64(p + 8)); }
      else if (size === 0) size = v.byteLength - p;
      if (size < 8) break;
      if (type === "moov") return { moov: { offset: base + p, size }, afterMdat };
      if (type === "mdat") afterMdat = base + p + size;
      p += size;
    }
    return { moov: null as { offset: number; size: number } | null, afterMdat };
  };

  const head = scan(new DataView(await file.slice(0, CHUNK).arrayBuffer()), 0);
  if (head.moov) return head.moov;
  if (head.afterMdat > 0 && head.afterMdat < file.size) {
    const tail = scan(new DataView(await file.slice(head.afterMdat, head.afterMdat + CHUNK).arrayBuffer()), head.afterMdat);
    if (tail.moov) return tail.moov;
  }
  return null;
}

export async function parseM4BChapters(file: File): Promise<AudioChapter[]> {
  const loc = await findMoov(file);
  if (!loc) return [];
  const buf = await file.slice(loc.offset, loc.offset + loc.size).arrayBuffer();
  if (buf.byteLength < loc.size) return [];

  const v = new DataView(buf);
  const [moov] = boxes(v, 0, buf.byteLength);
  if (moov?.type !== "moov") return [];

  const chpl = find(moov.children, "chpl");
  if (chpl) {
    const chapters = fromChpl(v, chpl);
    if (chapters.length) return chapters;
  }

  const trak = chapterTrak(v, moov);
  const samples = trak ? textSamples(v, trak) : null;
  return samples ? fromText(file, samples) : [];
}
