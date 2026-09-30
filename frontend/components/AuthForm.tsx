"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

const COPY = {
  signin: {
    title: "Sign in to PreLegal",
    submit: "Sign in",
    busy: "Signing in…",
    switchPrompt: "New to PreLegal?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your PreLegal account",
    submit: "Create account",
    busy: "Creating account…",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/signin",
  },
} as const;

const inputClass =
  "mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20";

export default function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const copy = COPY[mode];
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in: go straight to the app.
  useEffect(() => {
    api.me().then(
      () => router.replace("/"),
      () => {},
    );
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await (mode === "signin" ? api.signIn : api.signUp)({ email, password });
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn’t reach PreLegal. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border-t-4 border-brand-yellow bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-gray">PreLegal</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-navy">{copy.title}</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-stone-800">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-800">Password</span>
            {mode === "signup" && (
              <span className="block text-xs text-brand-gray">At least 8 characters</span>
            )}
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              maxLength={128}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? copy.busy : copy.submit}
          </button>
        </form>

        <p className="mt-6 text-sm text-brand-gray">
          {copy.switchPrompt}{" "}
          <Link href={copy.switchHref} className="font-semibold text-brand-blue hover:underline">
            {copy.switchLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
