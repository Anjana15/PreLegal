export default function AppHeader({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <header className="border-t-4 border-brand-yellow border-b border-b-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="text-lg font-bold text-brand-navy">PreLegal</span>
        <div className="flex min-w-0 items-center gap-4">
          <span className="truncate text-sm text-brand-gray">{email}</span>
          <button
            type="button"
            onClick={onSignOut}
            className="shrink-0 text-sm font-semibold text-brand-blue hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
