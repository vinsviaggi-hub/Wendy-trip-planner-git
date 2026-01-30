import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-4">
          <aside className="hidden md:block w-64 shrink-0">
            <div className="rounded-2xl border border-black/10 p-4 sticky top-6">
              <div className="font-semibold text-lg">Wendenzo</div>
              <div className="text-xs opacity-60 mt-1">Trip Planner</div>

              <nav className="mt-6 space-y-1 text-sm">
                <Link className="block rounded-lg px-3 py-2 hover:bg-black/5" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="block rounded-lg px-3 py-2 hover:bg-black/5" href="/">
                  Landing
                </Link>
              </nav>

              <div className="mt-6 text-xs opacity-60 leading-relaxed">
                MVP in locale (salvataggio nel browser). Poi lo colleghiamo a Supabase.
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="md:hidden mb-4 flex items-center justify-between">
              <Link href="/" className="font-semibold">Wendenzo</Link>
              <Link href="/dashboard" className="text-sm underline underline-offset-4">
                Dashboard
              </Link>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
