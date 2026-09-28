export type Party = {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
};

export type NdaValues = {
  purpose: string;
  /** ISO date, YYYY-MM-DD. */
  effectiveDate: string;
  mndaTermType: "expires" | "untilTerminated";
  mndaTermYears: string;
  confidentialityType: "years" | "perpetuity";
  confidentialityYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: Party;
  party2: Party;
};

export type PartyKey = "party1" | "party2";

const emptyParty: Party = { name: "", title: "", company: "", noticeAddress: "" };

export function defaultValues(effectiveDate: string): NdaValues {
  return {
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate,
    mndaTermType: "expires",
    mndaTermYears: "1",
    confidentialityType: "years",
    confidentialityYears: "1",
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: { ...emptyParty },
    party2: { ...emptyParty },
  };
}

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Formats YYYY-MM-DD as e.g. "September 28, 2026" without timezone shifts. */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  const [, y, m, d] = match.map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function parseYears(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const years = Number(raw);
  return years >= 1 && years <= 99 ? years : null;
}

const pluralYears = (n: number) => `${n} year${n === 1 ? "" : "s"}`;

/** Labels of required fields that are empty or invalid, in form order. */
export function missingFields(v: NdaValues): string[] {
  const missing: string[] = [];
  if (!v.purpose.trim()) missing.push("Purpose");
  if (!formatDate(v.effectiveDate)) missing.push("Effective Date");
  if (v.mndaTermType === "expires" && parseYears(v.mndaTermYears) === null) {
    missing.push("MNDA Term (years)");
  }
  if (v.confidentialityType === "years" && parseYears(v.confidentialityYears) === null) {
    missing.push("Term of Confidentiality (years)");
  }
  if (!v.governingLaw.trim()) missing.push("Governing Law");
  if (!v.jurisdiction.trim()) missing.push("Jurisdiction");
  if (!v.party1.company.trim()) missing.push("Party 1 company");
  if (!v.party2.company.trim()) missing.push("Party 2 company");
  return missing;
}

/**
 * A cover page entry. `value` is null when the user hasn't supplied it yet,
 * so renderers can show `placeholder` instead.
 */
export type CoverField = {
  heading: string;
  hint?: string;
  value: string | null;
  placeholder: string;
};

const orNull = (s: string) => (s.trim() ? s.trim() : null);

/** The filled-in cover page fields, shared by the HTML preview and the PDF. */
export function coverFields(v: NdaValues): CoverField[] {
  const mndaYears = parseYears(v.mndaTermYears);
  const confYears = parseYears(v.confidentialityYears);
  return [
    {
      heading: "Purpose",
      hint: "How Confidential Information may be used",
      value: orNull(v.purpose),
      placeholder: "[Purpose]",
    },
    {
      heading: "Effective Date",
      value: formatDate(v.effectiveDate) || null,
      placeholder: "[Effective Date]",
    },
    {
      heading: "MNDA Term",
      hint: "The length of this MNDA",
      value:
        v.mndaTermType === "untilTerminated"
          ? "Continues until terminated in accordance with the terms of the MNDA."
          : mndaYears
            ? `Expires ${pluralYears(mndaYears)} from Effective Date.`
            : null,
      placeholder: "Expires [number of years] from Effective Date.",
    },
    {
      heading: "Term of Confidentiality",
      hint: "How long Confidential Information is protected",
      value:
        v.confidentialityType === "perpetuity"
          ? "In perpetuity."
          : confYears
            ? `${pluralYears(confYears)} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`
            : null,
      placeholder: "[Number of years] from Effective Date.",
    },
    {
      heading: "Governing Law",
      value: orNull(v.governingLaw),
      placeholder: "[State]",
    },
    {
      heading: "Jurisdiction",
      value: v.jurisdiction.trim() ? `Courts located in ${v.jurisdiction.trim()}` : null,
      placeholder: "Courts located in [city or county and state]",
    },
    {
      heading: "MNDA Modifications",
      value: orNull(v.modifications) ?? "None.",
      placeholder: "",
    },
  ];
}

export const signatureRows: { label: string; key: keyof Party | null }[] = [
  { label: "Signature", key: null },
  { label: "Print Name", key: "name" },
  { label: "Title", key: "title" },
  { label: "Company", key: "company" },
  { label: "Notice Address", key: "noticeAddress" },
  { label: "Date", key: null },
];

/** A filesystem-safe PDF filename naming both companies when known. */
export function pdfFilename(v: NdaValues): string {
  const slug = (s: string) =>
    s.trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const parts = ["Mutual-NDA", slug(v.party1.company), slug(v.party2.company)].filter(Boolean);
  return `${parts.join("_")}.pdf`;
}
