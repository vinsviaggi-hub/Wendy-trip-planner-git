import Link from "next/link";

const pro = [
  {
    t: "Template pronti",
    d: "City break, weekend, road trip: parti già con una struttura ordinata.",
    chip: "PRO",
  },
  {
    t: "Budget intelligente",
    d: "Totali per giorno e avvisi quando stai sforando. Niente conti a caso.",
    chip: "PRO",
  },
  {
    t: "Condivisione viaggio",
    d: "Invita chi viaggia con te: stesso piano, stessa chat, zero confusione.",
    chip: "PRO",
  },
  {
    t: "Export PDF",
    d: "Esporta l’itinerario in PDF: utile offline e comodo da stampare.",
    chip: "PRO",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen text-[rgb(var(--ink))]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* NAV */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl btn-primary grid place-items-center">
              🧭
            </div>
            <div className="leading-tight">
              <div className="text-xl font-semibold tracking-tight">Wendenzo</div>
              <div className="text-xs text-[rgb(var(--muted))]">Itinerari • mappe • budget • chat</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex rounded-xl btn-secondary px-4 py-2 text-sm"
            >
              Dashboard
            </Link>

            <Link
              href="/login"
              className="inline-flex rounded-xl btn-primary px-4 py-2 text-sm font-semibold"
            >
              Accedi
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="mt-10 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line))/0.16] bg-white/25 backdrop-blur px-3 py-1 text-xs text-[rgb(var(--muted))]">
              <span className="h-2 w-2 rounded-full" style={{ background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent2)))" }} />
              Planner viaggio premium • giorni • mappe • budget
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              Pianifica il viaggio.
              <span className="block" style={{ color: "rgb(var(--accent2))" }}>
                Giorno per giorno, senza caos.
              </span>
            </h1>

            <p className="mt-4 text-sm md:text-base leading-relaxed text-[rgb(var(--muted))] max-w-xl">
              Crea itinerari con attività, orari, note e link mappa. Tieni il budget sotto controllo e
              organizza tutto in un posto solo.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-xl btn-primary px-5 py-3 text-sm font-semibold">
                Inizia ora
              </Link>

              <a href="#come-funziona" className="rounded-xl btn-secondary px-5 py-3 text-sm">
                Come funziona
              </a>
            </div>

            {/* quick trust */}
            <div className="mt-7 grid grid-cols-3 gap-3 max-w-md">
              {[
                ["0 caos", "tutto ordinato"],
                ["offline", "export PDF"],
                ["gruppo", "chat + link"],
              ].map(([a, b]) => (
                <div key={a} className="glass-soft p-3">
                  <div className="text-sm font-semibold">{a}</div>
                  <div className="text-xs text-[rgb(var(--muted))] mt-1">{b}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-[rgb(var(--muted))]">
              Non è un sito di prenotazioni: è un planner serio per organizzare itinerari.
            </div>
          </div>

          {/* PREVIEW */}
          <div className="grad-border">
            <div className="glass p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Anteprima viaggio</div>
                  <div className="text-xs text-[rgb(var(--muted))] mt-1">
                    Struttura chiara e pronta da compilare
                  </div>
                </div>
                <span className="text-xs rounded-full border border-[rgb(var(--line))/0.16] bg-white/25 px-3 py-1 text-[rgb(var(--muted))]">
                  3 giorni
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="glass-soft p-4">
                  <div className="text-sm font-semibold">City break</div>
                  <div className="text-xs text-[rgb(var(--muted))]">Budget: 350€ • note + mappe</div>
                </div>

                <div className="glass-soft p-4">
                  <div className="text-xs text-[rgb(var(--muted))]">Day 1</div>
                  <div className="mt-1 text-sm">
                    <span className="text-[rgb(var(--muted))] mr-2">09:30</span> Centro + punto panoramico
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <span className="rounded-full bg-white/25 px-2 py-1 border border-[rgb(var(--line))/0.16]">€ 15</span>
                    <span className="rounded-full bg-white/25 px-2 py-1 border border-[rgb(var(--line))/0.16]">mappa</span>
                  </div>
                </div>

                <div className="glass-soft p-4">
                  <div className="text-xs text-[rgb(var(--muted))]">Day 2</div>
                  <div className="mt-1 text-sm">
                    <span className="text-[rgb(var(--muted))] mr-2">10:00</span> Museo + passeggiata
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <span className="rounded-full bg-white/25 px-2 py-1 border border-[rgb(var(--line))/0.16]">€ 22</span>
                    <span className="rounded-full bg-white/25 px-2 py-1 border border-[rgb(var(--line))/0.16]">note</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-[rgb(var(--line))/0.16] bg-white/22 px-3 py-2">Giorni</div>
                <div className="rounded-xl border border-[rgb(var(--line))/0.16] bg-white/22 px-3 py-2">Mappe</div>
                <div className="rounded-xl border border-[rgb(var(--line))/0.16] bg-white/22 px-3 py-2">Budget</div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            ["Planner giornaliero", "Attività con orari, note e costi. Tutto ordinato e facile da rileggere."],
            ["Mappe integrate", "Link rapidi alle posizioni: apri tutto al volo mentre sei in giro."],
            ["Chat nel viaggio", "Messaggi nello stesso posto dell’itinerario: decisioni e piano sempre allineati."],
          ].map(([t, d]) => (
            <div key={t} className="glass-soft p-6">
              <div className="font-semibold">{t}</div>
              <div className="mt-2 text-sm text-[rgb(var(--muted))] leading-relaxed">{d}</div>
            </div>
          ))}
        </section>

        {/* PRO */}
        <section className="mt-10 grad-border">
          <div className="glass p-8" id="pro">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold">Funzioni Pro</div>
                <div className="text-sm text-[rgb(var(--muted))] mt-1">
                  Strumenti avanzati per organizzare viaggi complessi in modo semplice.
                </div>
              </div>
              <Link href="/dashboard" className="rounded-xl btn-primary px-4 py-2 text-sm font-semibold">
                Provala ora
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {pro.map((x) => (
                <div key={x.t} className="glass-soft p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{x.t}</div>
                    <span className="text-[11px] rounded-full bg-white/25 px-2 py-1 border border-[rgb(var(--line))/0.16] text-[rgb(var(--muted))]">
                      {x.chip}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[rgb(var(--muted))] leading-relaxed">{x.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="come-funziona" className="mt-14 grad-border">
          <div className="glass p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold">Come funziona</div>
                <div className="text-sm text-[rgb(var(--muted))] mt-1">Tre passaggi, tutto chiaro.</div>
              </div>
              <Link href="/dashboard" className="rounded-xl btn-primary px-4 py-2 text-sm font-semibold">
                Crea un viaggio
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                ["1) Crea il viaggio", "Titolo, destinazione, budget e numero di giorni."],
                ["2) Compila il planner", "Attività, orari, note e link mappa."],
                ["3) Organizza con la chat", "Messaggi e decisioni collegati al viaggio."],
              ].map(([t, d]) => (
                <div key={t} className="glass-soft p-5">
                  <div className="text-sm font-semibold">{t}</div>
                  <div className="mt-2 text-sm text-[rgb(var(--muted))] leading-relaxed">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-16 text-xs text-[rgb(var(--muted))]">
          ©️ {new Date().getFullYear()} Wendenzo
        </footer>
      </div>
    </div>
  );
}
