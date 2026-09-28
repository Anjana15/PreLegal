/**
 * Parses the Common Paper Mutual NDA Standard Terms markdown
 * (templates/Mutual-NDA.md) into a structure both the HTML preview and the
 * PDF renderer can draw from.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  /** A defined term that refers to a Cover Page field, e.g. "Purpose". */
  | { type: "term"; text: string }
  | { type: "link"; text: string; href: string };

export type Clause = { number: number; heading: string; body: Inline[] };

export type StandardTerms = {
  title: string;
  clauses: Clause[];
  attribution: Inline[];
};

const INLINE =
  /\*\*(.+?)\*\*|<span class="coverpage_link">(.+?)<\/span>|\[([^\]]+)\]\(([^)]+)\)/g;

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of source.matchAll(INLINE)) {
    if (m.index > last) out.push({ type: "text", text: source.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: "bold", text: m[1] });
    else if (m[2] !== undefined) out.push({ type: "term", text: m[2] });
    else out.push({ type: "link", text: m[3], href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < source.length) out.push({ type: "text", text: source.slice(last) });
  return out;
}

const CLAUSE = /^(\d+)\.\s+\*\*(.+?)\*\*\.\s*(.*)$/;

export function parseStandardTerms(markdown: string): StandardTerms {
  let title = "Standard Terms";
  const clauses: Clause[] = [];
  const attribution: Inline[] = [];

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) {
      title = line.slice(2).trim();
      continue;
    }
    const clause = CLAUSE.exec(line);
    if (clause) {
      clauses.push({
        number: Number(clause[1]),
        heading: clause[2],
        body: parseInline(clause[3]),
      });
    } else {
      attribution.push(...parseInline(line));
    }
  }

  if (clauses.length === 0) {
    throw new Error("Mutual NDA template has no numbered clauses; has its format changed?");
  }
  return { title, clauses, attribution };
}
