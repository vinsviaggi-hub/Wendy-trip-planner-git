import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-[rgb(var(--ink))]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-4">
          {/* SIDEBAR */}
          <aside className="hidden md:block w-72 shrink-0">
            <div className="sticky top-6 grad-border">
              <div className="glass p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl btn-primary grid place-items-center">
                    🧭
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold text-lg text-[rgb(var(--ink))]">Wendenzo</div>
                    <div className="text-xs text-[rgb(var(--muted))] mt-0.5">Trip Planner</div>
                  </div>
                </div>

                {/* NAV */}
                <nav className="mt-6 space-y-2 text-sm">
                  <Link
                    className="block rounded-xl px-3 py-2 border border-[rgb(var(--line))/0.18] bg-white/20 hover:bg-white/30 transition"
                    href="/dashboard"
                  >
                    Dashboard
                  </Link>

                  <Link
                    className="block rounded-xl px-3 py-2 border border-[rgb(var(--line))/0.18] bg-white/20 hover:bg-white/30 transition"
                    href="/"
                  >
                    Landing
                  </Link>
                </nav>

                {/* INFO */}
                <div className="mt-6 rounded-2xl border border-[rgb(var(--line))/0.14] bg-white/18 p-4">
                  <div className="text-xs text-[rgb(var(--muted))] leading-relaxed">
                    Planner viaggi: itinerario giorno per giorno, budget e chat nello stesso posto.
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
                    <span className="rounded-full border border-[rgb(var(--line))/0.16] bg-white/18 px-2 py-1">
                      itinerario
                    </span>
                    <span className="rounded-full border border-[rgb(var(--line))/0.16] bg-white/18 px-2 py-1">
                      budget
                    </span>
                    <span className="rounded-full border border-[rgb(var(--line))/0.16] bg-white/18 px-2 py-1">
                      chat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="flex-1">
            {/* TOP BAR MOBILE */}
            <div className="md:hidden mb-4 grad-border">
              <div className="glass px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href="/" className="font-semibold text-[rgb(var(--ink))]">
                    Wendenzo
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard"
                      className="rounded-xl btn-primary px-3 py-2 text-sm font-semibold"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
