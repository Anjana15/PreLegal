import AuthGate from "@/components/AuthGate";
import NdaCreator from "@/components/NdaCreator";
import { loadStandardTerms } from "@/lib/loadStandardTerms";

export default async function Home() {
  const terms = await loadStandardTerms();

  return (
    <AuthGate>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">PreLegal</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">Mutual NDA Creator</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Fill in the details on the left. The agreement on the right updates as you type, and you
            can download it as a PDF when it’s ready to sign.
          </p>
        </header>
        <NdaCreator terms={terms} />
        <footer className="mt-12 text-xs text-stone-500">
          Based on the Common Paper Mutual Non-Disclosure Agreement (Version 1.0), used under{" "}
          <a className="underline" href="https://creativecommons.org/licenses/by/4.0/">
            CC BY 4.0
          </a>
          . PreLegal does not provide legal advice.
        </footer>
      </main>
    </AuthGate>
  );
}
