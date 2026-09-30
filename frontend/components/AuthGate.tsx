"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import { api, ApiError, type User } from "@/lib/api";

/**
 * Renders its children only for a signed-in user, and sends everyone else to /signin.
 * The pages are static files, so this check can only happen in the browser.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .me()
      .then((me) => active && setUser(me))
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) router.replace("/signin");
        else setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    await api.signOut().catch(() => {});
    router.replace("/signin");
  }

  if (failed) {
    return (
      <p role="alert" className="p-8 text-sm text-red-700">
        Couldn’t reach PreLegal. Please refresh the page to try again.
      </p>
    );
  }
  if (!user) return <p className="p-8 text-sm text-brand-gray">Loading…</p>;

  return (
    <>
      <AppHeader email={user.email} onSignOut={handleSignOut} />
      {children}
    </>
  );
}
