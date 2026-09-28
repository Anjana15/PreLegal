import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { defaultValues } from "@/lib/nda";
import { parseStandardTerms } from "@/lib/standardTerms";
import { NdaPdf } from "./NdaPdf";

describe("NdaPdf", () => {
  it("renders the cover page and standard terms to a PDF", async () => {
    const terms = parseStandardTerms(
      readFileSync(path.join(__dirname, "..", "..", "templates", "Mutual-NDA.md"), "utf8"),
    );
    const values = defaultValues("2026-09-28");
    values.governingLaw = "Delaware";
    values.party1 = { name: "Ada Lovelace", title: "CEO", company: "Acme, Inc.", noticeAddress: "ada@acme.test" };

    const buffer = await renderToBuffer(<NdaPdf values={values} terms={terms} />);

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    const pageCount = buffer.toString("latin1").match(/\/Type \/Page\b/g)?.length ?? 0;
    expect(pageCount).toBeGreaterThanOrEqual(2);
  });
});
