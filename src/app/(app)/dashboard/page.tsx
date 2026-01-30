"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Trip, TripDay } from "@/types/trip";
import { deleteTrip, loadTrips, uid, upsertTrip } from "@/lib/storage";
import { Button } from "@/components/ui/Button";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmtMoney(n: number) {
  try {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
  } catch {
    return `€ ${n}`;
  }
}

function buildDays(count: number): TripDay[] {
  const c = clamp(count, 1, 21);
  return Array.from({ length: c }).map((_, i) => ({
    id: uid("day"),
    dayIndex: i + 1,
    label: `Day ${i + 1}`,
    items: [],
  }));
}

/**
 * Migrazione soft per viaggi vecchi salvati nel browser:
 * - aggiunge dayIndex se manca
 * - normalizza createdAt a number
 * - mette items: [] se manca
 * - riordina i giorni per dayIndex
 */
function normalizeTrip(raw: Trip): { trip: Trip; changed: boolean } {
  let changed = false;

  const createdAt =
    typeof raw.createdAt === "number" && Number.isFinite(raw.createdAt)
      ? raw.createdAt
      : (() => {
          changed = true;
          return Date.now();
        })();

  const days = Array.isArray(raw.days) ? raw.days : [];
  if (!Array.isArray(raw.days)) changed = true;

  const normalizedDays: TripDay[] = days.map((d: any, idx: number) => {
    const hasDayIndex = typeof d?.dayIndex === "number" && Number.isFinite(d.dayIndex);
    const dayIndex = hasDayIndex ? d.dayIndex : idx + 1;
    if (!hasDayIndex) changed = true;

    const label =
      typeof d?.label === "string" && d.label.trim().length > 0 ? d.label : `Day ${dayIndex}`;
    if (label !== d?.label) changed = true;

    const items = Array.isArray(d?.items) ? d.items : [];
    if (!Array.isArray(d?.items)) changed = true;

    return {
      id: typeof d?.id === "string" && d.id ? d.id : uid("day"),
      dayIndex,
      label,
      date: typeof d?.date === "string" ? d.date : undefined,
      items,
    };
  });

  normalizedDays.sort((a, b) => a.dayIndex - b.dayIndex);

  if (days.length === normalizedDays.length) {
    for (let i = 0; i < normalizedDays.length; i++) {
      if (normalizedDays[i].id !== days[i]?.id) {
        changed = true;
        break;
      }
    }
  }

  const trip: Trip = {
    ...raw,
    createdAt,
    title: String(raw.title ?? "").trim(),
    destination: raw.destination?.trim() ? raw.destination.trim() : undefined,
    budget: typeof raw.budget === "number" && Number.isFinite(raw.budget) ? raw.budget : undefined,
    days: normalizedDays,
  };

  if (trip.title !== raw.title) changed = true;
  if ((trip.destination ?? "") !== (raw.destination ?? "")) changed = true;

  return { trip, changed };
}

export default function DashboardPage() {
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [daysCount, setDaysCount] = useState<number>(4);

  function refresh() {
    const loaded = loadTrips();
    const normalized: Trip[] = [];
    let anyChanged = false;

    for (const t of loaded) {
      const { trip, changed } = normalizeTrip(t);
      normalized.push(trip);
      if (changed) {
        anyChanged = true;
        upsertTrip(trip);
      }
    }

    setTrips(normalized);
    void anyChanged;
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCreate = useMemo(() => title.trim().length >= 2, [title]);

  const totals = useMemo(() => {
    const tripsCount = trips.length;
    let totalDays = 0;
    let totalItems = 0;

    trips.forEach((t) => {
      totalDays += t.days?.length ?? 0;
      (t.days ?? []).forEach((d) => (totalItems += d.items?.length ?? 0));
    });

    return { tripsCount, totalDays, totalItems };
  }, [trips]);

  function quickSet(kind: "weekend" | "4days" | "week") {
    if (kind === "weekend") setDaysCount(3);
    if (kind === "4days") setDaysCount(4);
    if (kind === "week") setDaysCount(7);
  }

  function createTrip() {
    if (!canCreate) return;

    const cleaned = budget.replace(",", ".").trim();
    const parsed = cleaned ? Number(cleaned) : NaN;
    const b = Number.isFinite(parsed) ? parsed : undefined;

    const tripId = uid("trip");

    const newTrip: Trip = {
      id: tripId,
      title: title.trim(),
      destination: destination.trim() || undefined,
      budget: b,
      days: buildDays(daysCount),
      createdAt: Date.now(),
    };

    upsertTrip(newTrip);

    setTitle("");
    setDestination("");
    setBudget("");
    setDaysCount(4);

    router.push(`/trip/${tripId}`);
  }

  function removeTrip(id: string) {
    if (!confirm("Eliminare questo viaggio?")) return;
    deleteTrip(id);
    refresh();
  }

  return (
    <div className="min-h-screen">
      {/* background più “scuro” e visibile al 100% */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 780px at 10% 12%, rgba(2,132,199,0.42), transparent 62%)," +
              "radial-gradient(1200px 820px at 90% 16%, rgba(13,148,136,0.34), transparent 60%)," +
              "radial-gradient(1100px 740px at 55% 92%, rgba(245,158,11,0.20), transparent 62%)," +
              "linear-gradient(180deg, rgba(2,6,23,0.14), rgba(2,6,23,0.06))," +
              "#D8E9FF",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1400px 980px at 50% 45%, rgba(255,255,255,0.10), rgba(0,0,0,0.10))",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* top bar */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-600 to-teal-600 shadow-md ring-1 ring-black/25" />
            <div>
              <div className="text-xl font-semibold tracking-tight text-slate-900">
                Wendy Trip Planner
              </div>
              <div className="text-xs text-slate-600">Dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:inline-flex rounded-xl bg-white/40 backdrop-blur border border-black/25 px-4 py-2 text-sm hover:bg-white/55 shadow-sm"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-xl border border-black/25 bg-white/35 backdrop-blur px-4 py-2 text-sm hover:bg-white/55 shadow-sm"
            >
              Accedi
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* left */}
          <aside className="lg:col-span-4">
            <div className="rounded-3xl border border-black/25 bg-white/40 backdrop-blur p-6 shadow-md ring-1 ring-black/10">
              <div className="text-sm font-semibold text-slate-900">Panoramica</div>
              <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                Crea e gestisci i tuoi viaggi. Tutto rimane ordinato, leggibile e pronto da
                compilare giorno per giorno.
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-black/25 bg-white/35 backdrop-blur p-3 shadow-sm ring-1 ring-black/10">
                  <div className="text-xs text-slate-600">Viaggi</div>
                  <div className="text-lg font-semibold text-slate-900">{totals.tripsCount}</div>
                </div>
                <div className="rounded-2xl border border-black/25 bg-white/35 backdrop-blur p-3 shadow-sm ring-1 ring-black/10">
                  <div className="text-xs text-slate-600">Giorni</div>
                  <div className="text-lg font-semibold text-slate-900">{totals.totalDays}</div>
                </div>
                <div className="rounded-2xl border border-black/25 bg-white/35 backdrop-blur p-3 shadow-sm ring-1 ring-black/10">
                  <div className="text-xs text-slate-600">Attività</div>
                  <div className="text-lg font-semibold text-slate-900">{totals.totalItems}</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-black/25 bg-gradient-to-r from-sky-500/15 to-teal-500/15 p-4 ring-1 ring-black/10">
                <div className="text-sm font-semibold text-slate-900">Cosa puoi fare</div>
                <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
                  <li>Giorni già pronti e ordinati</li>
                  <li>Attività con orari, note e link mappa</li>
                  <li>Costi segnati e budget sotto controllo</li>
                  <li>Chat dentro ogni viaggio</li>
                </ul>
              </div>
            </div>
          </aside>

          {/* right */}
          <div className="lg:col-span-8 space-y-6">
            {/* create */}
            <div className="rounded-3xl border border-black/25 bg-white/40 backdrop-blur p-6 shadow-md ring-1 ring-black/10">
              <div>
                <div className="text-sm font-semibold text-slate-900">Crea un nuovo viaggio</div>
                <div className="text-sm text-slate-700 mt-1">
                  Inserisci i dettagli e scegli i giorni. Poi compili l’itinerario.
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-xl border border-black/25 bg-white/45 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/35"
                  placeholder="Titolo (es. Norvegia 4 giorni)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input
                  className="rounded-xl border border-black/25 bg-white/45 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/35"
                  placeholder="Destinazione (opzionale)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <input
                  className="rounded-xl border border-black/25 bg-white/45 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="Budget € (opzionale)"
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl border border-black/25 bg-white/35 backdrop-blur px-3 py-2 ring-1 ring-black/10">
                  <span className="text-xs text-slate-600">Giorni</span>
                  <select
                    className="bg-transparent text-sm text-slate-900 outline-none"
                    value={daysCount}
                    onChange={(e) => setDaysCount(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14, 21].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => quickSet("weekend")}
                  className="rounded-xl border border-black/25 bg-white/35 backdrop-blur px-3 py-2 text-sm hover:bg-white/50 shadow-sm ring-1 ring-black/10"
                >
                  Weekend (3)
                </button>
                <button
                  onClick={() => quickSet("4days")}
                  className="rounded-xl border border-black/25 bg-white/35 backdrop-blur px-3 py-2 text-sm hover:bg-white/50 shadow-sm ring-1 ring-black/10"
                >
                  4 giorni
                </button>
                <button
                  onClick={() => quickSet("week")}
                  className="rounded-xl border border-black/25 bg-white/35 backdrop-blur px-3 py-2 text-sm hover:bg-white/50 shadow-sm ring-1 ring-black/10"
                >
                  Settimana (7)
                </button>

                <div className="ml-auto">
                  <Button onClick={createTrip} disabled={!canCreate}>
                    Crea viaggio
                  </Button>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-700">
                Budget e costi sono opzionali: il planner resta pulito.
              </div>
            </div>

            {/* list */}
            <div className="rounded-3xl border border-black/25 bg-white/40 backdrop-blur p-6 shadow-md ring-1 ring-black/10">
              <div>
                <div className="text-sm font-semibold text-slate-900">I tuoi viaggi</div>
                <div className="text-sm text-slate-700 mt-1">Apri e continua. Ordine dal più recente.</div>
              </div>

              <div className="mt-5 grid gap-3">
                {trips.length === 0 ? (
                  <div className="rounded-2xl border border-black/25 bg-white/35 backdrop-blur p-5 text-sm text-slate-700 ring-1 ring-black/10">
                    Nessun viaggio ancora. Creane uno sopra e inizia.
                  </div>
                ) : (
                  trips
                    .slice()
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((t) => {
                      const days = t.days?.length ?? 0;
                      const items = (t.days ?? []).reduce((acc, d) => acc + (d.items?.length ?? 0), 0);

                      return (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-black/25 bg-white/40 backdrop-blur p-5 shadow-sm ring-1 ring-black/10 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-semibold text-slate-900 truncate">{t.title}</div>

                              <span className="text-xs rounded-full border border-black/25 bg-black/5 px-2 py-1">
                                {days} giorni
                              </span>
                              <span className="text-xs rounded-full border border-black/25 bg-black/5 px-2 py-1">
                                {items} attività
                              </span>

                              {typeof t.budget === "number" ? (
                                <span className="text-xs rounded-full border border-black/25 bg-black/5 px-2 py-1">
                                  Budget: {fmtMoney(t.budget)}
                                </span>
                              ) : null}
                            </div>

                            <div className="text-xs text-slate-700 mt-1">{t.destination ?? "—"}</div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <Link
                              href={`/trip/${t.id}`}
                              className="rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-white px-4 py-2 text-sm hover:opacity-95 shadow-md"
                            >
                              Apri
                            </Link>
                            <Button variant="secondary" onClick={() => removeTrip(t.id)}>
                              Elimina
                            </Button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 text-xs text-slate-700">
          ©️ {new Date().getFullYear()} Wendy Trip Planner
        </footer>
      </div>
    </div>
  );
}