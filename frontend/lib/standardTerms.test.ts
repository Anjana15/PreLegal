import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseInline, parseStandardTerms } from "./standardTerms";

describe("parseInline", () => {
  it("splits bold, cover page terms and links from plain text", () => {
    expect(
      parseInline(
        'Use for the <span class="coverpage_link">Purpose</span> (“**MNDA**”), see [site](https://x.test).',
      ),
    ).toEqual([
      { type: "text", text: "Use for the " },
      { type: "term", text: "Purpose" },
      { type: "text", text: " (“" },
      { type: "bold", text: "MNDA" },
      { type: "text", text: "”), see " },
      { type: "link", text: "site", href: "https://x.test" },
      { type: "text", text: "." },
    ]);
  });

  it("returns plain text unchanged", () => {
    expect(parseInline("No markup here.")).toEqual([{ type: "text", text: "No markup here." }]);
  });
});

describe("parseStandardTerms", () => {
  it("parses the title, numbered clauses and trailing attribution", () => {
    const terms = parseStandardTerms(
      "# Standard Terms\n\n1. **Intro**. Hello.\r\n\n2. **Law**. Laws of <span class=\"coverpage_link\">Governing Law</span>.\n\nFree under [CC BY 4.0](https://cc.test).\n",
    );
    expect(terms.title).toBe("Standard Terms");
    expect(terms.clauses).toEqual([
      { number: 1, heading: "Intro", body: [{ type: "text", text: "Hello." }] },
      {
        number: 2,
        heading: "Law",
        body: [
          { type: "text", text: "Laws of " },
          { type: "term", text: "Governing Law" },
          { type: "text", text: "." },
        ],
      },
    ]);
    expect(terms.attribution).toContainEqual({ type: "link", text: "CC BY 4.0", href: "https://cc.test" });
  });

  it("rejects markdown with no clauses", () => {
    expect(() => parseStandardTerms("# Standard Terms\n\nJust text.")).toThrow(/no numbered clauses/);
  });

  it("parses the real Common Paper template without leaving markup behind", () => {
    const markdown = readFileSync(
      path.join(__dirname, "..", "..", "templates", "Mutual-NDA.md"),
      "utf8",
    );
    const terms = parseStandardTerms(markdown);
    expect(terms.clauses.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(terms.clauses[8].heading).toBe("Governing Law and Jurisdiction");

    const allText = [...terms.clauses.flatMap((c) => c.body), ...terms.attribution]
      .map((p) => p.text)
      .join("");
    expect(allText).not.toMatch(/<span|\*\*|\]\(/);
  });
});
