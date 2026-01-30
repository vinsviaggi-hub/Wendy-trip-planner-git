import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Background più scuro (non dipende da classi custom) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1100px 700px at 10% 12%, rgba(14,165,233,0.38), transparent 62%)," +
              "radial-gradient(1100px 760px at 90% 16%, rgba(20,184,166,0.30), transparent 60%)," +
              "radial-gradient(1000px 680px at 55% 92%, rgba(245,158,11,0.18), transparent 62%)," +
              "linear-gradient(180deg, rgba(15,23,42,0.10), rgba(15,23,42,0.02))," +
              "#E6F0FF",
          }}
        />
        {/* vignette per togliere l’effetto “bianco sparato” */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 900px at 50% 40%, rgba(255,255,255,0.10), rgba(0,0,0,0.08))",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* NAV */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-md ring-1 ring-black/20" />
            <div>
              <div className="text-xl font-semibold tracking-tight text-slate-900">
                Wendy Trip Planner
              </div>
              <div className="text-xs text-slate-600">Itinerari • mappe • budget • chat</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex rounded-xl border border-black/25 bg-white/45 backdrop-blur px-4 py-2 text-sm hover:bg-white/60 shadow-sm"
            >
              Accedi
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="mt-10 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/45 backdrop-blur border border-black/20 px-3 py-1 text-xs shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-teal-500" />
              Planner pulito • giorni • mappe • budget
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-slate-900">
              Pianifica il viaggio.
              <span className="block bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent">
                Giorno per giorno, senza caos.
              </span>
            </h1>

            <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-700 max-w-xl">
              Crea itinerari con attività, orari, note e link mappa. Tieni il budget sotto controllo e
              organizza tutto in un posto solo.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-white px-5 py-3 text-sm hover:opacity-95 shadow-md"
              >
                Inizia ora
              </Link>

              <a
                href="#come-funziona"
                className="rounded-xl bg-white/45 backdrop-blur border border-black/20 px-5 py-3 text-sm hover:bg-white/60 shadow-sm"
              >
                Come funziona
              </a>
            </div>
          </div>

          {/* PREVIEW (no “demo”, no “esempio”) */}
          <div className="rounded-3xl border border-black/20 bg-white/45 backdrop-blur p-6 shadow-md ring-1 ring-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Anteprima viaggio</div>
                <div className="text-xs text-slate-600 mt-1">Struttura chiara e pronta da compilare</div>
              </div>
              <span className="text-xs rounded-full bg-black/5 px-3 py-1 border border-black/20">
                3 giorni
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white/55 border border-black/20 p-4 shadow-sm">
                <div className="text-sm font-medium text-slate-900">City break</div>
                <div className="text-xs text-slate-600">Budget: 350€ • note + mappe</div>
              </div>

              <div className="rounded-2xl bg-white/55 border border-black/20 p-4">
                <div className="text-xs text-slate-600">Day 1</div>
                <div className="mt-1 text-sm text-slate-900">
                  <span className="text-slate-600 mr-2">09:30</span> Centro + punto panoramico
                </div>
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-black/5 px-2 py-1 border border-black/20">€ 15</span>
                  <span className="rounded-full bg-black/5 px-2 py-1 border border-black/20">mappa</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/55 border border-black/20 p-4">
                <div className="text-xs text-slate-600">Day 2</div>
                <div className="mt-1 text-sm text-slate-900">
                  <span className="text-slate-600 mr-2">10:00</span> Museo + passeggiata
                </div>
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-black/5 px-2 py-1 border border-black/20">€ 22</span>
                  <span className="rounded-full bg-black/5 px-2 py-1 border border-black/20">note</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-sky-500/10 border border-black/20 px-3 py-2">Giorni</div>
              <div className="rounded-xl bg-teal-500/10 border border-black/20 px-3 py-2">Mappe</div>
              <div className="rounded-xl bg-amber-500/10 border border-black/20 px-3 py-2">Budget</div>
            </div>
          </div>
        </section>

        {/* FEATURES (una volta sola, testi pro) */}
        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            ["Planner giornaliero", "Attività con orari, note e costi. Tutto ordinato e facile da rileggere."],
            ["Mappe integrate", "Link rapidi alle posizioni: apri tutto al volo mentre sei in giro."],
            ["Chat nel viaggio", "Messaggi nello stesso posto dell’itinerario: decisioni e piano sempre allineati."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-black/20 bg-white/45 backdrop-blur p-6 shadow-sm ring-1 ring-black/10">
              <div className="font-semibold text-slate-900">{t}</div>
              <div className="mt-2 text-sm text-slate-700 leading-relaxed">{d}</div>
            </div>
          ))}
        </section>

        {/* HOW IT WORKS (pulito) */}
        <section
          id="come-funziona"
          className="mt-14 rounded-3xl border border-black/20 bg-white/45 backdrop-blur p-8 shadow-md ring-1 ring-black/10"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-slate-900">Come funziona</div>
              <div className="text-sm text-slate-700 mt-1">Tre passaggi, tutto chiaro.</div>
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-white px-4 py-2 text-sm hover:opacity-95 shadow-md"
            >
              Crea un viaggio
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["1) Crea il viaggio", "Titolo, destinazione, budget e numero di giorni."],
              ["2) Compila il planner", "Attività, orari, note e link mappa."],
              ["3) Organizza con la chat", "Messaggi e decisioni collegati al viaggio."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-black/20 bg-white/55 p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">{t}</div>
                <div className="mt-2 text-sm text-slate-700 leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 text-xs text-slate-600">
          ©️ {new Date().getFullYear()} Wendy Trip Planner
        </footer>
      </div>
    </div>
  );
}