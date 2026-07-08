export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightInDoc(
  doc: Document,
  terms: string[],
  // Optional: decide the mark's className per matched term (e.g. by SRS status).
  // Must always include "lc-saved" so click handling and cleanup keep working.
  classFor?: (term: string) => string,
) {
  if (terms.length === 0) return;
  const pattern = new RegExp(
    `\\b(${terms.map(escapeRegex).join("|")})\\b`,
    "gi",
  );
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName.toLowerCase();
      if (
        tag === "script" ||
        tag === "style" ||
        p.classList.contains("lc-saved")
      )
        return NodeFilter.FILTER_REJECT;
      if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let cur: Node | null;
  while ((cur = walker.nextNode())) nodes.push(cur as Text);
  for (const node of nodes) {
    const text = node.nodeValue!;
    if (!pattern.test(text)) {
      pattern.lastIndex = 0;
      continue;
    }
    pattern.lastIndex = 0;
    const frag = doc.createDocumentFragment();
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text))) {
      if (m.index > last)
        frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
      const mark = doc.createElement("mark");
      mark.className = classFor ? classFor(m[0]) : "lc-saved";
      mark.textContent = m[0];
      frag.appendChild(mark);
      last = m.index + m[0].length;
    }
    if (last < text.length)
      frag.appendChild(doc.createTextNode(text.slice(last)));
    node.parentNode?.replaceChild(frag, node);
  }
}

export function highlightPhrasesInDoc(doc: Document, phrases: string[]) {
  const valid = phrases.filter((p) => p && p.length >= 2);
  if (valid.length === 0) return;
  const pattern = new RegExp(`(${valid.map(escapeRegex).join("|")})`, "gi");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName.toLowerCase();
      if (tag === "script" || tag === "style") return NodeFilter.FILTER_REJECT;
      if (
        p.classList.contains("lc-saved") ||
        p.classList.contains("lc-bm-phrase")
      )
        return NodeFilter.FILTER_REJECT;
      if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let cur: Node | null;
  while ((cur = walker.nextNode())) nodes.push(cur as Text);
  for (const node of nodes) {
    const text = node.nodeValue!;
    if (!pattern.test(text)) {
      pattern.lastIndex = 0;
      continue;
    }
    pattern.lastIndex = 0;
    const frag = doc.createDocumentFragment();
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text))) {
      if (m.index > last)
        frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
      const mark = doc.createElement("mark");
      mark.className = "lc-bm-phrase";
      mark.textContent = m[0];
      frag.appendChild(mark);
      last = m.index + m[0].length;
    }
    if (last < text.length)
      frag.appendChild(doc.createTextNode(text.slice(last)));
    node.parentNode?.replaceChild(frag, node);
  }
}
