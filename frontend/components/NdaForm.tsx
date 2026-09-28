import type { ReactNode } from "react";
import type { NdaValues, Party, PartyKey } from "@/lib/nda";

const inputClass =
  "mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200";
const yearsClass =
  "w-16 rounded-md border border-stone-300 bg-white px-2 py-1 text-sm focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100 disabled:text-stone-400";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-800">{label}</span>
      {hint && <span className="block text-xs text-stone-500">{hint}</span>}
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-stone-200 pt-5">
      <legend className="pr-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export default function NdaForm({
  values,
  onChange,
}: {
  values: NdaValues;
  onChange: (next: NdaValues) => void;
}) {
  const set = <K extends keyof NdaValues>(key: K, value: NdaValues[K]) =>
    onChange({ ...values, [key]: value });
  const setParty = (partyKey: PartyKey, field: keyof Party, value: string) =>
    onChange({ ...values, [partyKey]: { ...values[partyKey], [field]: value } });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Section title="Agreement">
        <Field label="Purpose" hint="How Confidential Information may be used">
          <textarea
            className={inputClass}
            rows={3}
            value={values.purpose}
            onChange={(e) => set("purpose", e.target.value)}
          />
        </Field>

        <Field label="Effective Date">
          <input
            type="date"
            className={inputClass}
            value={values.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </Field>

        <div role="radiogroup" aria-labelledby="mnda-term-label">
          <span id="mnda-term-label" className="text-sm font-medium text-stone-800">
            MNDA Term
          </span>
          <span className="block text-xs text-stone-500">The length of this MNDA</span>
          <div className="mt-2 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mndaTermType"
                checked={values.mndaTermType === "expires"}
                onChange={() => set("mndaTermType", "expires")}
              />
              Expires
              <input
                type="number"
                min={1}
                max={99}
                aria-label="MNDA term in years"
                className={yearsClass}
                value={values.mndaTermYears}
                disabled={values.mndaTermType !== "expires"}
                onChange={(e) => set("mndaTermYears", e.target.value)}
              />
              year(s) from Effective Date
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mndaTermType"
                checked={values.mndaTermType === "untilTerminated"}
                onChange={() => set("mndaTermType", "untilTerminated")}
              />
              Continues until terminated
            </label>
          </div>
        </div>

        <div role="radiogroup" aria-labelledby="confidentiality-label">
          <span id="confidentiality-label" className="text-sm font-medium text-stone-800">
            Term of Confidentiality
          </span>
          <span className="block text-xs text-stone-500">
            How long Confidential Information is protected
          </span>
          <div className="mt-2 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="confidentialityType"
                checked={values.confidentialityType === "years"}
                onChange={() => set("confidentialityType", "years")}
              />
              <input
                type="number"
                min={1}
                max={99}
                aria-label="Term of confidentiality in years"
                className={yearsClass}
                value={values.confidentialityYears}
                disabled={values.confidentialityType !== "years"}
                onChange={(e) => set("confidentialityYears", e.target.value)}
              />
              year(s) from Effective Date
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="confidentialityType"
                checked={values.confidentialityType === "perpetuity"}
                onChange={() => set("confidentialityType", "perpetuity")}
              />
              In perpetuity
            </label>
          </div>
        </div>
      </Section>

      <Section title="Governing Law & Jurisdiction">
        <Field label="Governing Law" hint="State whose laws govern the MNDA">
          <input
            className={inputClass}
            placeholder="e.g. Delaware"
            value={values.governingLaw}
            onChange={(e) => set("governingLaw", e.target.value)}
          />
        </Field>
        <Field label="Jurisdiction" hint="City or county and state where disputes are heard">
          <input
            className={inputClass}
            placeholder="e.g. New Castle, DE"
            value={values.jurisdiction}
            onChange={(e) => set("jurisdiction", e.target.value)}
          />
        </Field>
        <Field label="MNDA Modifications" hint="Optional changes to the Standard Terms">
          <textarea
            className={inputClass}
            rows={2}
            value={values.modifications}
            onChange={(e) => set("modifications", e.target.value)}
          />
        </Field>
      </Section>

      {(["party1", "party2"] as const).map((partyKey, i) => (
        <Section key={partyKey} title={`Party ${i + 1}`}>
          <Field label="Company">
            <input
              className={inputClass}
              value={values[partyKey].company}
              onChange={(e) => setParty(partyKey, "company", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Signer name">
              <input
                className={inputClass}
                value={values[partyKey].name}
                onChange={(e) => setParty(partyKey, "name", e.target.value)}
              />
            </Field>
            <Field label="Title">
              <input
                className={inputClass}
                value={values[partyKey].title}
                onChange={(e) => setParty(partyKey, "title", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Notice address" hint="Email or postal address">
            <textarea
              className={inputClass}
              rows={2}
              value={values[partyKey].noticeAddress}
              onChange={(e) => setParty(partyKey, "noticeAddress", e.target.value)}
            />
          </Field>
        </Section>
      ))}
    </form>
  );
}
