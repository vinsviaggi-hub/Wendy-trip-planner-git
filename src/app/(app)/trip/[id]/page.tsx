"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import type { Trip, TripDay, TripItem } from "@/types/trip";
import { getTrip, uid, upsertTrip } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { TripChat } from "@/components/chat/TripChat"; // named export ✅

function fmtMoney(n: number) {
  try {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
  } catch {
    return `€ ${n}`;
  }
}

function parseEuro(input: string): number | undefined {
  const cleaned = input.replace(",", ".").trim();
  const n = cleaned ? Number(cleaned) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/** Migrazione soft: sistema viaggi vecchi senza dayIndex/items ecc */
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

    const label = typeof d?.label === "string" && d.label.trim() ? d.label : `Day ${dayIndex}`;
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

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ Next: params è Promise -> va “unwrapped”
  const { id: tripId } = use(params);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  // form item
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => {
    const t = getTrip(tripId);
    if (!t) {
      setTrip(null);
      setActiveDayId(null);
      return;
    }

    const { trip: normalized, changed } = normalizeTrip(t);
    if (changed) upsertTrip(normalized);

    setTrip(normalized);

    const firstDay = normalized.days.slice().sort((a, b) => a.dayIndex - b.dayIndex)[0];
    setActiveDayId(firstDay?.id ?? null);
  }, [tripId]);

  const activeDay: TripDay | null = useMemo(() => {
    if (!trip || !activeDayId) return null;
    return trip.days.find((d) => d.id === activeDayId) ?? null;
  }, [trip, activeDayId]);

  const totals = useMemo(() => {
    if (!trip) return { days: 0, items: 0, cost: 0 };

    let items = 0;
    let costSum = 0;

    trip.days.forEach((d) => {
      d.items.forEach((it) => {
        items += 1;
        if (typeof it.cost === "number") costSum += it.cost;
      });
    });

    return { days: trip.days.length, items, cost: costSum };
  }, [trip]);

  function save(next: Trip) {
    upsertTrip(next);
    setTrip(next);
  }

  function addDay() {
    if (!trip) return;

    const maxIndex = (trip.days ?? []).reduce((m, d) => Math.max(m, d.dayIndex || 0), 0);
    const nextIndex = maxIndex + 1;

    const newDay: TripDay = {
      id: uid("day"),
      dayIndex: nextIndex,
      label: `Day ${nextIndex}`,
      items: [],
    };

    const next: Trip = {
      ...trip,
      days: [...trip.days, newDay].slice().sort((a, b) => a.dayIndex - b.dayIndex),
    };

    save(next);
    setActiveDayId(newDay.id);
  }

  function addItem() {
    if (!trip || !activeDay) return;
    if (title.trim().length < 2) return;

    const parsedCost = cost ? parseEuro(cost) : undefined;

    const item: TripItem = {
      id: uid("item"),
      title: title.trim(),
      time: time.trim() || undefined,
      note: note.trim() || undefined,
      mapUrl: mapUrl.trim() || undefined,
      cost: parsedCost,
    };

    const nextDays = trip.days.map((d) =>
      d.id === activeDay.id ? { ...d, items: [item, ...d.items] } : d
    );

    save({ ...trip, days: nextDays });

    setTitle("");
    setTime("");
    setNote("");
    setMapUrl("");
    setCost("");
  }

  function removeItem(itemId: string) {
    if (!trip || !activeDay) return;

    const nextDays = trip.days.map((d) =>
      d.id === activeDay.id ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d
    );

    save({ ...trip, days: nextDays });
  }

  // pagina non trovata
  if (!trip) {
    return (
      <div className="min-h-screen">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-28 left-[-140px] h-[520px] w-[520px] rounded-full bg-accent/20 blur-[90px]" />
          <div className="absolute top-10 right-[-160px] h-[560px] w-[560px] rounded-full bg-accent2/18 blur-[100px]" />
          <div className="absolute bottom-[-220px] left-1/3 h-[620px] w-[620px] rounded-full bg-sun/14 blur-[110px]" />
        </div>

        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-3xl border border-black/20 bg-white/70 backdrop-blur p-6 shadow-soft">
            <div className="text-sm text-muted">Viaggio non trovato su questo browser.</div>
            <div className="mt-4">
              <Link className="underline underline-offset-4 text-sm" href="/dashboard">
                Torna alla dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sortedDays = trip.days.slice().sort((a, b) => a.dayIndex - b.dayIndex);

  return (
    <div className="min-h-screen">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-[-140px] h-[520px] w-[520px] rounded-full bg-accent/20 blur-[90px]" />
        <div className="absolute top-10 right-[-160px] h-[560px] w-[560px] rounded-full bg-accent2/18 blur-[100px]" />
        <div className="absolute bottom-[-220px] left-1/3 h-[620px] w-[620px] rounded-full bg-sun/14 blur-[110px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* header */}
        <header className="rounded-3xl border border-black/20 bg-white/70 backdrop-blur p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-xs text-muted">Viaggio</div>
              <h1 className="text-2xl md:text-3xl font-semibold text-ink truncate">{trip.title}</h1>

              <div className="text-sm text-muted mt-1">
                {(trip.destination ?? "—") +
                  (typeof trip.budget === "number" ? ` • Budget: ${fmtMoney(trip.budget)}` : "")}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-black/20 bg-black/5 px-2 py-1">
                  {totals.days} giorni
                </span>
                <span className="rounded-full border border-black/20 bg-black/5 px-2 py-1">
                  {totals.items} attività
                </span>
                <span className="rounded-full border border-black/20 bg-black/5 px-2 py-1">
                  Costi segnati: {fmtMoney(totals.cost)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm underline underline-offset-4 text-muted">
                Dashboard
              </Link>
              <Button variant="secondary" onClick={addDay}>
                + Giorno
              </Button>
            </div>
          </div>

          {/* day tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            {sortedDays.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDayId(d.id)}
                className={`rounded-xl px-4 py-2 text-sm border transition ${
                  d.id === activeDayId
                    ? "bg-gradient-to-r from-accent to-accent2 text-white border-transparent shadow-soft"
                    : "border-black/20 bg-white/60 backdrop-blur hover:bg-white shadow-card"
                }`}
              >
                {d.label}
                <span className="ml-2 opacity-80">({d.items.length})</span>
              </button>
            ))}
          </div>
        </header>

        {/* main */}
        <section className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* add activity */}
          <div className="lg:col-span-4 rounded-3xl border border-black/20 bg-white/70 backdrop-blur p-6 shadow-soft">
            <div className="font-semibold text-ink">Aggiungi attività</div>
            <div className="text-xs text-muted mt-1">{activeDay ? `Nel ${activeDay.label}` : "Seleziona un giorno"}</div>

            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-black/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Titolo (es. museo, spiaggia, trekking...)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-black/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent2/30"
                placeholder="Orario (es. 09:30)"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-black/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Link mappa (opzionale)"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-black/20 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sun/25"
                placeholder="Costo € (opzionale)"
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl border border-black/20 bg-white/80 px-4 py-3 text-sm min-h-[110px] outline-none focus:ring-2 focus:ring-accent2/20"
                placeholder="Note (opzionale)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <Button onClick={addItem} disabled={!activeDay || title.trim().length < 2}>
                Aggiungi
              </Button>

              <div className="text-xs text-muted">Tip: titolo corto + orario = planner super leggibile.</div>
            </div>
          </div>

          {/* list */}
          <div className="lg:col-span-8 rounded-3xl border border-black/20 bg-white/70 backdrop-blur p-6 shadow-soft">
            <div>
              <div className="text-sm font-semibold text-ink">{activeDay?.label ?? "—"}</div>
              <div className="text-xs text-muted mt-1">Attività del giorno</div>
            </div>

            <div className="mt-4 space-y-3">
              {!activeDay || activeDay.items.length === 0 ? (
                <div className="text-sm text-muted rounded-2xl border border-black/20 bg-white/60 backdrop-blur p-4">
                  Nessuna attività ancora. Aggiungine una a sinistra.
                </div>
              ) : (
                activeDay.items.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-2xl border border-black/20 bg-white/70 backdrop-blur p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-ink text-sm">
                          {it.time ? <span className="text-muted mr-2">{it.time}</span> : null}
                          {it.title}
                        </div>

                        {it.note ? (
                          <div className="text-sm text-muted mt-2 leading-relaxed whitespace-pre-wrap">{it.note}</div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                          {typeof it.cost === "number" ? (
                            <span className="rounded-full bg-black/5 border border-black/20 px-2 py-1">
                              {fmtMoney(it.cost)}
                            </span>
                          ) : null}

                          {it.mapUrl ? (
                            <a
                              className="rounded-full bg-black/5 border border-black/20 px-2 py-1 underline underline-offset-4"
                              href={it.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Apri mappa
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <Button variant="secondary" size="sm" onClick={() => removeItem(it.id)}>
                        Elimina
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* chat */}
        <section className="mt-6 rounded-3xl border border-black/20 bg-white/70 backdrop-blur p-6 shadow-soft">
          <div>
            <div className="text-sm font-semibold text-ink">Chat del viaggio</div>
            <div className="text-sm text-muted mt-1">Messaggi e decisioni nello stesso posto del piano.</div>
          </div>

          <div className="mt-4">
            <TripChat tripId={tripId} />
          </div>
        </section>

        <footer className="mt-10 text-xs text-muted">©️ {new Date().getFullYear()} Wendenzo</footer>
      </div>
    </div>
  );
}