"use client";

import { useEffect, useState } from "react";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import { defaultValues, missingFields, pdfFilename, todayIso, type NdaValues } from "@/lib/nda";
import type { StandardTerms } from "@/lib/standardTerms";

async function downloadPdf(values: NdaValues, terms: StandardTerms) {
  // Loaded on demand: the PDF renderer is large and only needed on download.
  const [{ pdf }, { NdaPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/NdaPdf"),
  ]);
  const blob = await pdf(<NdaPdf values={values} terms={terms} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pdfFilename(values);
  link.click();
  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function NdaCreator({ terms }: { terms: StandardTerms }) {
  // The page is prerendered at build time, so "today" is filled in on the client.
  const [values, setValues] = useState(() => defaultValues(""));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only default
    setValues((v) => (v.effectiveDate ? v : { ...v, effectiveDate: todayIso() }));
  }, []);

  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const missing = missingFields(values);

  async function handleDownload() {
    setStatus("working");
    try {
      await downloadPdf(values, terms);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <section aria-label="NDA details" className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2">
        <NdaForm values={values} onChange={setValues} />

        <div className="sticky bottom-0 mt-6 space-y-2 border-t border-stone-200 bg-stone-50 py-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={missing.length > 0 || status === "working"}
            className="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {status === "working" ? "Preparing PDF…" : "Download PDF"}
          </button>
          {missing.length > 0 && (
            <p className="text-xs text-stone-600">
              To download, fill in: {missing.join(", ")}.
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-xs text-red-700">
              Couldn’t create the PDF. Please try again.
            </p>
          )}
        </div>
      </section>

      <section aria-label="NDA preview">
        <NdaPreview values={values} terms={terms} />
      </section>
    </div>
  );
}
