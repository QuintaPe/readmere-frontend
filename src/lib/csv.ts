/** Descarga un blob como archivo, limpiando el object URL. */
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val).replace(/"/g, '""');
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str}"`
            : str;
        })
        .join(","),
    ),
  ].join("\n");
  downloadBlob(
    `${filename}.csv`,
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
}

// Parser mínimo pero correcto: respeta campos entrecomillados con comas
// dentro y comillas escapadas ("").
function parseCsvLine(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"' && s[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Parsea un CSV con cabecera. Las cabeceras se normalizan (trim + minúsculas);
 * los valores se devuelven tal cual, indexados por cabecera.
 */
export function parseCsv(text: string): {
  headers: string[];
  records: Record<string, string>[];
} {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], records: [] };
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const records = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      rec[h] = cells[i] ?? "";
    });
    return rec;
  });
  return { headers, records };
}
