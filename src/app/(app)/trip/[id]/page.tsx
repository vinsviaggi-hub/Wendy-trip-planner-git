"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import type { Trip, TripDay, TripItem } from "@/types/trip";
import { getTrip, uid, upsertTrip } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { TripChat } from "@/components/chat/TripChat";

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
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

function Badge({
  tone,
  children,
}: {
  tone: "info" | "ok" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
      : tone === "warn"
      ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
      : tone === "danger"
      ? "border-red-300/25 bg-red-400/10 text-red-100"
      : "border-cyan-300/25 bg-cyan-400/10 text-cyan-100";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${cls}`}>
      {children}
    </span>
  );
}

function GlassCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl",
        "shadow-[0_22px_60px_rgba(0,0,0,0.30)] ring-1 ring-white/10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = use(params);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  // form item
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [cost, setCost] = useState("");

  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!toolsOpen) return;
      const el = toolsRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setToolsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [toolsOpen]);

  const sortedDays = useMemo(() => (trip?.days ?? []).slice().sort((a, b) => a.dayIndex - b.dayIndex), [trip]);

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

  const activeDayCost = useMemo(() => {
    if (!activeDay) return 0;
    return (activeDay.items ?? []).reduce((sum, it) => (typeof it.cost === "number" ? sum + it.cost : sum), 0);
  }, [activeDay]);

  const dayTarget = useMemo(() => {
    if (!trip?.budget) return undefined;
    const days = Math.max(1, trip.days?.length ?? 1);
    return trip.budget / days;
  }, [trip]);

  const budgetProgress = useMemo(() => {
    if (!trip?.budget || trip.budget <= 0) return undefined;
    return clamp(Math.round((totals.cost / trip.budget) * 100), 0, 100);
  }, [trip, totals.cost]);

  const remainingTrip = useMemo(() => {
    if (!trip?.budget) return undefined;
    return trip.budget - totals.cost;
  }, [trip, totals.cost]);

  const remainingDay = useMemo(() => {
    if (!dayTarget) return undefined;
    return dayTarget - activeDayCost;
  }, [dayTarget, activeDayCost]);

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

  function duplicateActiveDay() {
    if (!trip || !activeDay) return;
    const maxIndex = (trip.days ?? []).reduce((m, d) => Math.max(m, d.dayIndex || 0), 0);
    const nextIndex = maxIndex + 1;

    const copy: TripDay = {
      ...activeDay,
      id: uid("day"),
      dayIndex: nextIndex,
      label: `Day ${nextIndex}`,
      items: (activeDay.items ?? []).map((it) => ({ ...it, id: uid("item") })),
    };

    const next: Trip = {
      ...trip,
      days: [...trip.days, copy].slice().sort((a, b) => a.dayIndex - b.dayIndex),
    };

    save(next);
    setActiveDayId(copy.id);
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

    const nextDays = trip.days.map((d) => (d.id === activeDay.id ? { ...d, items: [item, ...d.items] } : d));
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

  async function copyShareLink() {
    const url = `${window.location.origin}/trip/${tripId}`;
    const ok = await copyToClipboard(url);
    alert(ok ? "Link copiato." : "Non riesco a copiare. Copialo manualmente dalla barra indirizzi.");
  }

  function exportTripJson() {
    if (!trip) return;
    downloadJson(`wendenzo-trip-${tripId}.json`, trip);
  }

  function exportDayJson() {
    if (!trip || !activeDay) return;
    downloadJson(`wendenzo-day-${tripId}-${activeDay.dayIndex}.json`, activeDay);
  }

  if (!trip) {
    return (
      <div className="min-h-screen text-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <GlassCard className="p-6">
            <div className="text-sm text-slate-200/70">Viaggio non trovato su questo browser.</div>
            <div className="mt-4">
              <Link className="underline underline-offset-4 text-sm text-slate-100" href="/dashboard">
                Torna alla dashboard
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* HEADER */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 ring-1 ring-white/10 grid place-items-center">
                  🧭
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-200/60">Viaggio</div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 truncate">{trip.title}</h1>
                  <div className="text-sm text-slate-200/70 mt-1 truncate">
                    {(trip.destination ?? "—") +
                      (typeof trip.budget === "number" ? ` • Budget: ${fmtMoney(trip.budget)}` : "")}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="text-xs text-slate-200/60">Giorni</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-50">{totals.days}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="text-xs text-slate-200/60">Attività</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-50">{totals.items}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="text-xs text-slate-200/60">Totale costi</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-50">{fmtMoney(totals.cost)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="text-xs text-slate-200/60">Oggi</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-50">{fmtMoney(activeDayCost)}</div>
                </div>
              </div>

              {typeof trip.budget === "number" ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-50">Budget</div>
                    <div className="flex items-center gap-2">
                      <Badge tone={(remainingTrip ?? 0) < 0 ? "danger" : "ok"}>
                        {typeof remainingTrip === "number"
                          ? (remainingTrip < 0 ? "sforato" : "ok") + ` • residuo ${fmtMoney(Math.abs(remainingTrip))}`
                          : "—"}
                      </Badge>
                      {typeof remainingDay === "number" && dayTarget ? (
                        <Badge tone={remainingDay < 0 ? "warn" : "info"}>
                          target giorno {fmtMoney(dayTarget)} • {remainingDay < 0 ? "oltre" : "residuo"} {fmtMoney(Math.abs(remainingDay))}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-300/60 to-cyan-300/60"
                      style={{ width: `${budgetProgress ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-200/70">Utilizzo budget: {budgetProgress ?? 0}%</div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-200/60">
                  Aggiungi un budget nel viaggio per attivare target e avvisi.
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-sm text-slate-200/70 hover:text-slate-100 underline underline-offset-4">
                Dashboard
              </Link>

              <div className="relative" ref={toolsRef}>
                <button
                  onClick={() => setToolsOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-2 text-sm hover:bg-white/[0.10]"
                >
                  Strumenti <span className="opacity-70">▾</span>
                </button>

                {toolsOpen ? (
                  <div className="absolute right-0 top-11 z-30 w-64 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden ring-1 ring-white/10">
                    <button
                      className="w-full text-left px-4 py-3 text-sm hover:bg-white/5"
                      onClick={() => {
                        copyShareLink();
                        setToolsOpen(false);
                      }}
                    >
                      Copia link viaggio
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 text-sm hover:bg-white/5"
                      onClick={() => {
                        exportTripJson();
                        setToolsOpen(false);
                      }}
                    >
                      Esporta JSON (viaggio)
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 disabled:opacity-40"
                      disabled={!activeDay}
                      onClick={() => {
                        exportDayJson();
                        setToolsOpen(false);
                      }}
                    >
                      Esporta JSON (giorno attivo)
                    </button>
                    <div className="h-px bg-white/10" />
                    <button
                      className="w-full text-left px-4 py-3 text-sm hover:bg-white/5"
                      onClick={() => {
                        duplicateActiveDay();
                        setToolsOpen(false);
                      }}
                    >
                      Duplica giorno attivo
                    </button>
                  </div>
                ) : null}
              </div>

              <Button variant="secondary" onClick={addDay}>
                + Giorno
              </Button>
            </div>
          </div>

          {/* DAY TABS */}
          <div className="mt-5 flex flex-wrap gap-2">
            {sortedDays.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDayId(d.id)}
                className={[
                  "rounded-xl px-4 py-2 text-sm border transition",
                  d.id === activeDayId
                    ? "border-white/10 bg-gradient-to-r from-indigo-500/30 to-cyan-500/20 text-slate-50 shadow-[0_18px_45px_rgba(0,0,0,0.25)]"
                    : "border-white/10 bg-white/[0.05] text-slate-200/80 hover:bg-white/[0.08]",
                ].join(" ")}
              >
                {d.label}
                <span className="ml-2 opacity-75">({d.items.length})</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* MAIN */}
        <section className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* ADD ACTIVITY */}
          <GlassCard className="lg:col-span-4 p-6">
            <div className="text-base font-semibold text-slate-50">Aggiungi attività</div>
            <div className="text-xs text-slate-200/70 mt-1">
              {activeDay ? `Nel ${activeDay.label}` : "Seleziona un giorno"}
            </div>

            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-200/50 focus:ring-2 focus:ring-indigo-500/25"
                placeholder="Titolo (es. museo, spiaggia, trekking...)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-200/50 focus:ring-2 focus:ring-cyan-500/25"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />

              <input
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-200/50 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Link mappa (opzionale)"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
              />

              <input
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none text-slate-100 placeholder:text-slate-200/50 focus:ring-2 focus:ring-amber-500/25"
                placeholder="Costo € (opzionale)"
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />

              <textarea
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm min-h-[110px] outline-none text-slate-100 placeholder:text-slate-200/50 focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Note (opzionale)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <Button onClick={addItem} disabled={!activeDay || title.trim().length < 2}>
                Aggiungi attività
              </Button>

              <div className="text-xs text-slate-200/60">
                Tip: titolo corto + orario = planner super leggibile.
              </div>
            </div>
          </GlassCard>

          {/* LIST */}
          <GlassCard className="lg:col-span-8 p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-base font-semibold text-slate-50">{activeDay?.label ?? "—"}</div>
                <div className="text-xs text-slate-200/70 mt-1">Attività del giorno</div>
              </div>

              {activeDay ? (
                <Badge tone={dayTarget && activeDayCost > (dayTarget ?? 0) ? "warn" : "info"}>
                  {dayTarget ? `Target: ${fmtMoney(dayTarget)} • Oggi: ${fmtMoney(activeDayCost)}` : `Oggi: ${fmtMoney(activeDayCost)}`}
                </Badge>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {!activeDay || activeDay.items.length === 0 ? (
                <div className="text-sm text-slate-200/70 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  Nessuna attività ancora. Aggiungine una a sinistra.
                </div>
              ) : (
                activeDay.items.map((it) => (
                  <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-50 text-sm">
                          {it.time ? <span className="text-slate-200/70 mr-2">{it.time}</span> : null}
                          {it.title}
                        </div>

                        {it.note ? (
                          <div className="text-sm text-slate-200/80 mt-2 leading-relaxed whitespace-pre-wrap">
                            {it.note}
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200/70">
                          {typeof it.cost === "number" ? (
                            <span className="rounded-full bg-white/[0.06] border border-white/10 px-2 py-1">
                              {fmtMoney(it.cost)}
                            </span>
                          ) : null}

                          {it.mapUrl ? (
                            <a
                              className="rounded-full bg-white/[0.06] border border-white/10 px-2 py-1 hover:underline"
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
          </GlassCard>
        </section>

        {/* CHAT */}
        <section className="mt-6">
          <TripChat tripId={tripId} />
        </section>

        <footer className="mt-10 text-xs text-slate-200/60">©️ {new Date().getFullYear()} Wendenzo</footer>
      </div>
    </div>
  );
}