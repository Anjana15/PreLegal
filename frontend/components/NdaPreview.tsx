import { coverFields, signatureRows, type NdaValues } from "@/lib/nda";
import type { Inline, StandardTerms } from "@/lib/standardTerms";

function InlineText({ parts }: { parts: Inline[] }) {
  return parts.map((part, i) => {
    switch (part.type) {
      case "bold":
        return <strong key={i}>{part.text}</strong>;
      case "term":
        return (
          <span key={i} className="underline decoration-stone-400 underline-offset-2">
            {part.text}
          </span>
        );
      case "link":
        return (
          <a key={i} href={part.href} target="_blank" rel="noreferrer" className="underline">
            {part.text}
          </a>
        );
      default:
        return part.text;
    }
  });
}

function Placeholder({ children }: { children: string }) {
  return <span className="rounded bg-amber-100 px-1 text-amber-900">{children}</span>;
}

export default function NdaPreview({
  values,
  terms,
}: {
  values: NdaValues;
  terms: StandardTerms;
}) {
  const parties = [values.party1, values.party2];

  return (
    <article className="mx-auto max-w-[8.5in] bg-white px-6 py-10 font-serif text-[15px] leading-relaxed text-stone-900 shadow-sm ring-1 ring-stone-200 sm:px-14">
      <h2 className="text-center text-2xl font-bold">Mutual Non-Disclosure Agreement</h2>

      <h3 className="mt-8 text-sm font-bold uppercase tracking-wide">
        Using this Mutual Non-Disclosure Agreement
      </h3>
      <p className="mt-2">
        This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page (“
        <strong>Cover Page</strong>”) and (2) the Common Paper Mutual NDA Standard Terms Version
        1.0 (“<strong>Standard Terms</strong>”) identical to those posted at{" "}
        <a
          href="https://commonpaper.com/standards/mutual-nda/1.0"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          commonpaper.com/standards/mutual-nda/1.0
        </a>
        . Any modifications of the Standard Terms should be made on the Cover Page, which will
        control over conflicts with the Standard Terms.
      </p>

      <dl className="mt-6 space-y-5">
        {coverFields(values).map((field) => (
          <div key={field.heading}>
            <dt className="font-bold">
              {field.heading}
              {field.hint && (
                <span className="ml-2 font-sans text-xs font-normal text-stone-500">
                  {field.hint}
                </span>
              )}
            </dt>
            <dd className="mt-1 whitespace-pre-line">
              {field.value ?? <Placeholder>{field.placeholder}</Placeholder>}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-6">
        By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective
        Date.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="w-1/4 border border-stone-300 p-2" />
              <th className="border border-stone-300 p-2 text-center">PARTY 1</th>
              <th className="border border-stone-300 p-2 text-center">PARTY 2</th>
            </tr>
          </thead>
          <tbody>
            {signatureRows.map((row) => (
              <tr key={row.label}>
                <th className="border border-stone-300 p-2 font-semibold">{row.label}</th>
                {parties.map((party, i) => (
                  <td key={i} className="h-10 whitespace-pre-line border border-stone-300 p-2">
                    {row.key ? party[row.key] : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 break-before-page text-center text-2xl font-bold">{terms.title}</h2>
      <ol className="mt-6 space-y-4">
        {terms.clauses.map((clause) => (
          <li key={clause.number}>
            {clause.number}. <strong>{clause.heading}</strong>.{" "}
            <InlineText parts={clause.body} />
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm text-stone-600">
        <InlineText parts={terms.attribution} />
      </p>
    </article>
  );
}
