import { describe, expect, it } from "vitest";
import { coverFields, defaultValues, formatDate, missingFields, pdfFilename, todayIso } from "./nda";

function complete() {
  const v = defaultValues("2026-09-28");
  v.governingLaw = "Delaware";
  v.jurisdiction = "New Castle, DE";
  v.party1.company = "Acme, Inc.";
  v.party2.company = "Globex LLC";
  return v;
}

const field = (v: ReturnType<typeof complete>, heading: string) =>
  coverFields(v).find((f) => f.heading === heading)!;

describe("formatDate", () => {
  it("formats ISO dates without shifting the day", () => {
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatDate("2026-12-31")).toBe("December 31, 2026");
  });

  it("returns an empty string for missing or malformed dates", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("28/09/2026")).toBe("");
  });
});

describe("todayIso", () => {
  it("uses local calendar fields and zero-pads", () => {
    expect(todayIso(new Date(2026, 2, 5, 23, 59))).toBe("2026-03-05");
  });
});

describe("missingFields", () => {
  it("is empty for a complete NDA", () => {
    expect(missingFields(complete())).toEqual([]);
  });

  it("lists required fields that are blank", () => {
    const v = defaultValues("");
    v.purpose = "  ";
    expect(missingFields(v)).toEqual([
      "Purpose",
      "Effective Date",
      "Governing Law",
      "Jurisdiction",
      "Party 1 company",
      "Party 2 company",
    ]);
  });

  it("validates year counts only when a fixed term is chosen", () => {
    const v = complete();
    v.mndaTermYears = "0";
    v.confidentialityYears = "1.5";
    expect(missingFields(v)).toEqual(["MNDA Term (years)", "Term of Confidentiality (years)"]);

    v.mndaTermType = "untilTerminated";
    v.confidentialityType = "perpetuity";
    expect(missingFields(v)).toEqual([]);
  });
});

describe("coverFields", () => {
  it("fills in the cover page from the form values", () => {
    const v = complete();
    v.mndaTermYears = "2";
    expect(field(v, "Effective Date").value).toBe("September 28, 2026");
    expect(field(v, "MNDA Term").value).toBe("Expires 2 years from Effective Date.");
    expect(field(v, "Term of Confidentiality").value).toMatch(/^1 year from Effective Date, but in the case of trade secrets/);
    expect(field(v, "Governing Law").value).toBe("Delaware");
    expect(field(v, "Jurisdiction").value).toBe("Courts located in New Castle, DE");
  });

  it("uses the open-ended wording for the alternative options", () => {
    const v = complete();
    v.mndaTermType = "untilTerminated";
    v.confidentialityType = "perpetuity";
    expect(field(v, "MNDA Term").value).toBe(
      "Continues until terminated in accordance with the terms of the MNDA.",
    );
    expect(field(v, "Term of Confidentiality").value).toBe("In perpetuity.");
  });

  it("returns null for blank or invalid values so a placeholder is shown", () => {
    const v = defaultValues("");
    v.mndaTermYears = "abc";
    for (const heading of ["Effective Date", "MNDA Term", "Governing Law", "Jurisdiction"]) {
      expect(field(v, heading).value).toBeNull();
    }
  });

  it("states there are no modifications when none are given", () => {
    expect(field(defaultValues(""), "MNDA Modifications").value).toBe("None.");
  });
});

describe("pdfFilename", () => {
  it("names both companies with filesystem-safe characters", () => {
    expect(pdfFilename(complete())).toBe("Mutual-NDA_Acme-Inc_Globex-LLC.pdf");
  });

  it("falls back to a generic name", () => {
    expect(pdfFilename(defaultValues(""))).toBe("Mutual-NDA.pdf");
  });
});
