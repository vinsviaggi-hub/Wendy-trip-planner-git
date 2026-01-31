"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Trip, TripDay, TripItem } from "@/types/trip";
import { loadTrips, uid, upsertTrip, deleteTrip } from "@/lib/storage";
import { TripChat } from "@/components/chat/TripChat";
import { Button } from "@/components/ui/Button";
import { COUNTRY_OPTIONS, countryName } from "@/lib/geo/countries";
import { CitySelect } from "@/components/geo/CitySelect";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

type TemplateKey = "custom" | "citybreak3" | "weekend2" | "roadtrip7";

const TEMPLATE_OPTIONS: { key: TemplateKey; label: string }[] = [
  { key: "custom", label: "Personalizzato" },
  { key: "citybreak3", label: "City break • 3 giorni" },
  { key: "weekend2", label: "Weekend • 2 giorni" },
  { key: "roadtrip7", label: "Road trip • 7 giorni" },
];

function templateDays(key: TemplateKey): { daysCount: number; defaultTitle: string; seed?: (d: number) => TripItem[] } {
  if (key === "weekend2") {
    return {
      daysCount: 2,
      defaultTitle: "Weekend",
      seed: (day) =>
        day === 1
          ? [
              { id: uid("item"), title: "Arrivo + check-in", time: "11:00" },
              { id: uid("item"), title: "Centro / passeggiata", time: "16:30" },
              { id: uid("item"), title: "Cena", time: "20:30" },
            ]
          : [
              { id: uid("item"), title: "Colazione", time: "09:00" },
              { id: uid("item"), title: "Attività principale", time: "10:30" },
              { id: uid("item"), title: "Rientro", time: "18:00" },
            ],
    };
  }

  if (key === "citybreak3") {
    return {
      daysCount: 3,
      defaultTitle: "City break",
      seed: (day) =>
        day === 1
          ? [
              { id: uid("item"), title: "Arrivo + check-in", time: "12:00" },
              { id: uid("item"), title: "Punto panoramico", time: "17:30" },
            ]
          : day === 2
          ? [
              { id: uid("item"), title: "Museo / attrazione", time: "10:00" },
              { id: uid("item"), title: "Zona food / serata", time: "19:30" },
            ]
          : [
              { id: uid("item"), title: "Quartiere tipico / mercato", time: "10:00" },
              { id: uid("item"), title: "Partenza", time: "16:30" },
            ],
    };
  }

  if (key === "roadtrip7") {
    return {
      daysCount: 7,
      defaultTitle: "Road trip",
      seed: (day) => [
        { id: uid("item"), title: `Tappa ${day}`, time: "10:00" },
        { id: uid("item"), title: "Pranzo", time: "13:30" },
        { id: uid("item"), title: "Tramonto / foto spot", time: "19:00" },
      ],
    };
  }

  return { daysCount: 4, defaultTitle: "Viaggio" };
}

function safeParseNumber(s: string) {
  const cleaned = s.replace(",", ".").trim();
  const n = cleaned ? Number(cleaned) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function sumTrip(trip: Trip | null) {
  if (!trip) return 0;
  let total = 0;
  for (const d of trip.days ?? []) {
    for (const it of d.items ?? []) {
      if (typeof it.cost === "number") total += it.cost;
    }
  }
  return total;
}

function sumDay(day: TripDay | null) {
  if (!day) return 0;
  let total = 0;
  for (const it of day.items ?? []) {
    if (typeof it.cost === "number") total += it.cost;
  }
  return total;
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

function Badge({ tone, children }: { tone: "info" | "ok" | "warn" | "danger"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
      : tone === "warn"
      ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
      : tone === "danger"
      ? "border-red-300/30 bg-red-400/10 text-red-100"
      : "border-sky-300/30 bg-sky-400/10 text-sky-100";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${cls}`}>{children}</span>;
}

function GlassCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl",
        "shadow-[0_22px_60px_rgba(0,0,0,0.30)]",
        "ring-1 ring-white/10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [openTripId, setOpenTripId] = useState<string | null>(null);

  // form
  const [templateKey, setTemplateKey] = useState<TemplateKey>("custom");
  const [title, setTitle] = useState("");
  const [countryCode, setCountryCode] = useState("IT");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [daysCount, setDaysCount] = useState<number>(4);

  // planner
  const [activeDayIndex, setActiveDayIndex] = useState<number>(1);

  // activity
  const [itemTitle, setItemTitle] = useState("");
  const [itemTime, setItemTime] = useState("");
  const [itemMap, setItemMap] = useState("");
  const [itemCost, setItemCost] = useState<string>("");
  const [itemNote, setItemNote] = useState("");

  // actions state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const importRef = useRef<HTMLInputElement | null>(null);
  const pdfRef = useRef<HTMLDivElement | null>(null);

  function refresh() {
    const loaded = loadTrips().slice().sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    setTrips(loaded);
    if (openTripId && !loaded.find((t) => t.id === openTripId)) setOpenTripId(null);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (trips.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const trip = params.get("trip");
    if (!trip) return;

    const found = trips.find((t) => t.id === trip);
    if (found) {
      setOpenTripId(found.id);
      setActiveDayIndex(1);
    } else {
      alert("Questo link funziona solo su questo browser finché i viaggi sono salvati in locale.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  const canCreate = useMemo(() => title.trim().length >= 2, [title]);
  const budgetNum = useMemo(() => safeParseNumber(budget), [budget]);

  const openTrip = useMemo(() => {
    if (!openTripId) return null;
    return trips.find((t) => t.id === openTripId) ?? null;
  }, [openTripId, trips]);

  const activeDay = useMemo(() => {
    if (!openTrip) return null;
    return (openTrip.days ?? []).find((d) => d.dayIndex === activeDayIndex) ?? openTrip.days?.[0] ?? null;
  }, [openTrip, activeDayIndex]);

  const tripTotal = useMemo(() => sumTrip(openTrip), [openTrip]);
  const dayTotal = useMemo(() => sumDay(activeDay), [activeDay]);

  const dayTarget = useMemo(() => {
    if (!openTrip?.budget) return undefined;
    const days = Math.max(1, openTrip.days?.length ?? 1);
    return openTrip.budget / days;
  }, [openTrip]);

  const remainingTrip = useMemo(() => {
    if (!openTrip?.budget) return undefined;
    return openTrip.budget - tripTotal;
  }, [openTrip, tripTotal]);

  const remainingDay = useMemo(() => {
    if (!dayTarget) return undefined;
    return dayTarget - dayTotal;
  }, [dayTarget, dayTotal]);

  const tripOver = useMemo(() => {
    if (!openTrip?.budget) return false;
    return tripTotal > openTrip.budget;
  }, [openTrip, tripTotal]);

  const dayOver = useMemo(() => {
    if (!dayTarget) return false;
    return dayTotal > dayTarget;
  }, [dayTarget, dayTotal]);

  const budgetProgress = useMemo(() => {
    if (!openTrip?.budget || openTrip.budget <= 0) return undefined;
    return Math.min(100, Math.round((tripTotal / openTrip.budget) * 100));
  }, [openTrip, tripTotal]);

  function applyTemplate(k: TemplateKey) {
    const t = templateDays(k);
    setDaysCount(t.daysCount);
    if (title.trim().length < 2) setTitle(t.defaultTitle);
  }

  function createTrip() {
    if (!canCreate) return;

    const b = budgetNum;
    const tripId = uid("trip");
    const destination = [countryName(countryCode), city.trim()].filter(Boolean).join(" • ");

    const tpl = templateDays(templateKey);
    const days = buildDays(daysCount);

    const seeded =
      templateKey !== "custom" && tpl.seed
        ? days.map((d) => ({ ...d, items: (tpl.seed?.(d.dayIndex) ?? []).map((x) => ({ ...x })) }))
        : days;

    const newTrip: Trip = {
      id: tripId,
      title: title.trim(),
      destination: destination || undefined,
      budget: b,
      days: seeded,
      createdAt: Date.now(),
    };

    upsertTrip(newTrip);

    setTitle("");
    setCity("");
    setBudget("");
    setDaysCount(4);
    setTemplateKey("custom");

    setOpenTripId(tripId);
    setActiveDayIndex(1);
    refresh();
  }

  function removeTrip(id: string) {
    if (!confirm("Eliminare questo viaggio?")) return;
    deleteTrip(id);
    refresh();
  }

  function duplicateTrip() {
    if (!openTrip) return;
    const copyId = uid("trip");
    const copied: Trip = {
      ...openTrip,
      id: copyId,
      title: `${openTrip.title} (copia)`,
      createdAt: Date.now(),
      days: (openTrip.days ?? []).map((d) => ({
        ...d,
        id: uid("day"),
        items: (d.items ?? []).map((it) => ({ ...it, id: uid("item") })),
      })),
    };
    upsertTrip(copied);
    setOpenTripId(copyId);
    setActiveDayIndex(1);
    refresh();
  }

  function addItem() {
    if (!openTrip || !activeDay) return;
    if (itemTitle.trim().length < 1) return;

    const c = safeParseNumber(itemCost);

    const newItem: TripItem = {
      id: uid("item"),
      title: itemTitle.trim(),
      time: itemTime.trim() || undefined,
      mapUrl: itemMap.trim() || undefined,
      cost: c,
      note: itemNote.trim() || undefined,
    };

    const nextTrip: Trip = {
      ...openTrip,
      days: openTrip.days.map((d) =>
        d.dayIndex === activeDay.dayIndex ? { ...d, items: [newItem, ...(d.items ?? [])] } : d
      ),
    };

    upsertTrip(nextTrip);
    refresh();

    setItemTitle("");
    setItemTime("");
    setItemMap("");
    setItemCost("");
    setItemNote("");
  }

  function exportOpenTripJson() {
    if (!openTrip) return;
    downloadJson(`wendenzo-trip-${openTrip.id}.json`, openTrip);
  }

  async function onImportFile(file: File) {
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);

      if (!parsed || typeof parsed !== "object") throw new Error("bad");
      if (!(parsed as any).title || !(parsed as any).days) throw new Error("bad");

      const imported: Trip = {
        id: uid("trip"),
        title: String((parsed as any).title).slice(0, 80),
        destination: (parsed as any).destination ? String((parsed as any).destination).slice(0, 120) : undefined,
        budget: typeof (parsed as any).budget === "number" ? (parsed as any).budget : undefined,
        createdAt: Date.now(),
        days: Array.isArray((parsed as any).days)
          ? (parsed as any).days.slice(0, 21).map((d: any, idx: number) => ({
              id: uid("day"),
              dayIndex: idx + 1,
              label: `Day ${idx + 1}`,
              items: Array.isArray(d.items)
                ? d.items.slice(0, 200).map((it: any) => ({
                    id: uid("item"),
                    title: String(it.title ?? "").slice(0, 120),
                    time: it.time ? String(it.time).slice(0, 10) : undefined,
                    mapUrl: it.mapUrl ? String(it.mapUrl).slice(0, 500) : undefined,
                    cost: typeof it.cost === "number" ? it.cost : undefined,
                    note: it.note ? String(it.note).slice(0, 800) : undefined,
                  }))
                : [],
            }))
          : buildDays(4),
      };

      upsertTrip(imported);
      setOpenTripId(imported.id);
      setActiveDayIndex(1);
      refresh();
    } catch {
      alert("Import fallito. Usa un JSON esportato dall’app.");
    }
  }

  async function copyShareLink() {
    if (!openTrip) return;
    const url = `${window.location.origin}/dashboard?trip=${openTrip.id}`;
    const ok = await copyToClipboard(url);
    alert(ok ? "Link copiato." : "Non riesco a copiare. Copialo manualmente dalla barra indirizzi.");
  }

  async function exportPdf() {
    if (!openTrip || !pdfRef.current) return;
    setIsExportingPdf(true);

    try {
      const el = pdfRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "pt", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let y = 0;
      let remaining = imgH;

      pdf.setFontSize(12);
      pdf.text(`${openTrip.title}`, 40, 28);

      const topOffset = 40;

      pdf.addImage(imgData, "PNG", 0, topOffset, imgW, imgH);

      remaining -= (pdfH - topOffset);

      while (remaining > 0) {
        y -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, y, imgW, imgH);
        remaining -= pdfH;
      }

      pdf.save(`wendenzo-itinerario-${openTrip.id}.pdf`);
    } catch {
      alert("Export PDF fallito. Riprova.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* BACKGROUND: scuro, aurora, NON bianco */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />
        <div className="absolute -top-36 left-[-18%] h-[620px] w-[620px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute top-28 right-[-20%] h-[680px] w-[680px] rounded-full bg-cyan-500/18 blur-3xl" />
        <div className="absolute bottom-[-28%] left-[18%] h-[680px] w-[680px] rounded-full bg-emerald-500/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[length:18px_18px] opacity-[0.18]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_0%,rgba(255,255,255,0.10),transparent_55%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg ring-1 ring-white/10 grid place-items-center text-white">
              🧭
            </div>
            <div className="leading-tight">
              <div className="text-xl font-semibold tracking-tight">Wendenzo</div>
              <div className="text-xs text-slate-200/80">
                Planner viaggi premium: tappe, budget, note, chat e PDF.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-2 text-sm hover:bg-white/[0.10] shadow-sm"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 text-sm hover:opacity-95 shadow-md ring-1 ring-white/10"
            >
              Accedi
            </Link>
          </div>
        </header>

        {/* KPI */}
        <section className="mt-6 grid gap-3 md:grid-cols-3">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-200/70">Viaggi</div>
              <Badge tone="info">salvataggio locale</Badge>
            </div>
            <div className="mt-2 text-3xl font-semibold">{trips.length}</div>
            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[55%] bg-gradient-to-r from-indigo-400/70 to-cyan-400/70" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="text-xs text-slate-200/70">Totale viaggio</div>
            <div className="mt-2 text-3xl font-semibold">{openTrip ? `€ ${tripTotal.toFixed(0)}` : "—"}</div>
            <div className="mt-1 text-xs text-slate-200/70">
              {openTrip?.budget ? `Budget: € ${openTrip.budget.toFixed(0)}` : "Imposta un budget per tracking e target"}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-200/70">Oggi</div>
              {typeof remainingDay === "number" ? (
                <Badge tone={dayOver ? "danger" : "ok"}>{dayOver ? "oltre target" : "ok"}</Badge>
              ) : (
                <Badge tone="info">—</Badge>
              )}
            </div>
            <div className="mt-2 text-3xl font-semibold">{openTrip ? `€ ${dayTotal.toFixed(0)}` : "—"}</div>
            <div className="mt-1 text-xs text-slate-200/70">
              {dayTarget ? `Target: € ${dayTarget.toFixed(0)} • Residuo: € ${(remainingDay ?? 0).toFixed(0)}` : "—"}
            </div>
          </GlassCard>
        </section>

        {/* CREATE */}
        <GlassCard className="mt-6 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-base font-semibold">Crea un nuovo viaggio</div>
              <div className="text-sm text-slate-200/70 mt-1">
                Titolo, destinazione, giorni e template. Poi aggiungi tappe, costi e note.
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              <button
                onClick={() => setToolsOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-2 text-sm hover:bg-white/[0.10]"
              >
                Strumenti <span className="opacity-70">▾</span>
              </button>

              {toolsOpen ? (
                <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 disabled:opacity-40"
                    onClick={() => {
                      downloadJson("wendenzo-backup.json", trips);
                      setToolsOpen(false);
                    }}
                    disabled={trips.length === 0}
                  >
                    Backup JSON (tutti i viaggi)
                  </button>

                  <button
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/5"
                    onClick={() => {
                      importRef.current?.click();
                      setToolsOpen(false);
                    }}
                  >
                    Importa JSON
                  </button>

                  {openTrip ? (
                    <>
                      <div className="h-px bg-white/10" />
                      <button
                        className="w-full text-left px-4 py-3 text-sm hover:bg-white/5"
                        onClick={() => {
                          exportOpenTripJson();
                          setToolsOpen(false);
                        }}
                      >
                        Esporta viaggio aperto
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}

              <input
                ref={importRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportFile(f);
                  e.currentTarget.value = "";
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <input
              className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/25"
              placeholder="Titolo (es. Norvegia 4 giorni)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <select
              className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500/25"
              value={countryCode}
              onChange={(e) => {
                setCountryCode(e.target.value);
                setCity("");
              }}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code} className="text-slate-900">
                  {c.name}
                </option>
              ))}
            </select>

            <CitySelect countryCode={countryCode} value={city} onChange={setCity} />

            <input
              className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/25"
              placeholder="Budget € (opzionale)"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />

            <select
              className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={templateKey}
              onChange={(e) => {
                const k = e.target.value as TemplateKey;
                setTemplateKey(k);
                applyTemplate(k);
              }}
            >
              {TEMPLATE_OPTIONS.map((x) => (
                <option key={x.key} value={x.key} className="text-slate-900">
                  {x.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur px-3 py-2">
              <span className="text-xs text-slate-200/70">Giorni</span>
              <select
                className="bg-transparent text-sm outline-none"
                value={daysCount}
                onChange={(e) => setDaysCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 10, 14, 21].map((n) => (
                  <option key={n} value={n} className="text-slate-900">
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={createTrip}
                disabled={!canCreate}
                className={[
                  "rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg",
                  "bg-gradient-to-r from-indigo-500 to-cyan-500 ring-1 ring-white/10",
                  "hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                + Nuovo viaggio
              </button>
            </div>
          </div>
        </GlassCard>

        {/* LISTA */}
        <GlassCard className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-base font-semibold">I tuoi viaggi</div>
              <div className="text-xs text-slate-200/70 mt-1">Apri un viaggio e compila planner + chat.</div>
            </div>

            {openTrip ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={duplicateTrip}>
                  Duplica
                </Button>
                <Button variant="secondary" onClick={copyShareLink}>
                  Condividi link
                </Button>
                <Button variant="secondary" onClick={exportPdf} disabled={isExportingPdf}>
                  {isExportingPdf ? "PDF..." : "Export PDF"}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            {trips.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-white/[0.06] border border-white/10 grid place-items-center">
                    🧳
                  </div>
                  <div>
                    <div className="font-semibold">Nessun viaggio creato</div>
                    <div className="text-sm text-slate-200/70 mt-1">
                      Crea il primo viaggio e inizia a salvare tappe, costi e note.
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={createTrip}
                        disabled={!canCreate}
                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 text-sm font-semibold hover:opacity-95 disabled:opacity-40"
                      >
                        + Crea viaggio
                      </button>
                      <div className="mt-2 text-[11px] text-slate-200/70">
                        Suggerimento: scegli un template (Weekend / City break) per partire veloce.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              trips.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur p-5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{t.title}</div>
                    <div className="text-xs text-slate-200/70 mt-1">{t.destination ?? "—"}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-200/80">
                      <span className="rounded-full bg-white/[0.06] px-2 py-1 border border-white/10">
                        {t.days?.length ?? 0} giorni
                      </span>
                      {typeof t.budget === "number" ? (
                        <span className="rounded-full bg-white/[0.06] px-2 py-1 border border-white/10">
                          budget € {t.budget.toFixed(0)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/[0.06] px-2 py-1 border border-white/10">
                          nessun budget
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setOpenTripId(t.id);
                        setActiveDayIndex(1);
                      }}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 text-sm hover:opacity-95 shadow-md ring-1 ring-white/10"
                    >
                      Apri
                    </button>

                    <Button variant="secondary" onClick={() => removeTrip(t.id)}>
                      Elimina
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* PLANNER + CHAT */}
        {openTrip ? (
          <div ref={pdfRef}>
            <section className="mt-6 grid gap-6 lg:grid-cols-12">
              {/* LEFT */}
              <aside className="lg:col-span-4 space-y-6">
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">Riepilogo</div>
                      <div className="text-xs text-slate-200/70 mt-1">{openTrip.destination ?? "—"}</div>
                    </div>

                    <Badge tone={tripOver ? "danger" : "info"}>
                      {openTrip.budget ? (tripOver ? "budget sforato" : "budget ok") : "nessun budget"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200/70">Totale viaggio</span>
                      <span className="font-semibold">€ {tripTotal.toFixed(0)}</span>
                    </div>

                    {typeof openTrip.budget === "number" ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200/70">Budget</span>
                          <span className="font-semibold">€ {openTrip.budget.toFixed(0)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-200/70">Residuo</span>
                          <span className={`font-semibold ${tripOver ? "text-red-200" : "text-slate-100"}`}>
                            € {(remainingTrip ?? 0).toFixed(0)}
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-amber-300/60 to-cyan-300/60"
                              style={{ width: `${budgetProgress ?? 0}%` }}
                            />
                          </div>
                          <div className="mt-1 text-[11px] text-slate-200/70">
                            Utilizzo budget: {budgetProgress ?? 0}%
                            {tripOver ? <span className="ml-2 text-red-200 font-semibold">Sforato</span> : null}
                          </div>
                        </div>

                        {dayTarget ? (
                          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                            <div className="flex items-center justify-between text-xs text-slate-200/70">
                              <span>Target giorno</span>
                              <span className="font-semibold text-slate-100">€ {dayTarget.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-200/70 mt-1">
                              <span>Spesa oggi</span>
                              <span className={`font-semibold ${dayOver ? "text-red-200" : "text-slate-100"}`}>
                                € {dayTotal.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-200/70 mt-1">
                              <span>Residuo oggi</span>
                              <span className={`font-semibold ${dayOver ? "text-red-200" : "text-slate-100"}`}>
                                € {(remainingDay ?? 0).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-200/70 mt-2">
                        Inserisci un budget per attivare target giornaliero e alert.
                      </div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="text-base font-semibold">Aggiungi attività</div>
                  <div className="text-xs text-slate-200/70 mt-1">Nel {activeDay?.label ?? "giorno selezionato"}</div>

                  <div className="mt-4 grid gap-3">
                    <input
                      className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="Titolo (es. museo, spiaggia)"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                    />

                    <input
                      className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500/25"
                      type="time"
                      value={itemTime}
                      onChange={(e) => setItemTime(e.target.value)}
                    />

                    <input
                      className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/25"
                      placeholder="Link mappa (opzionale)"
                      value={itemMap}
                      onChange={(e) => setItemMap(e.target.value)}
                    />

                    <input
                      className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/25"
                      placeholder="Costo € (opzionale)"
                      inputMode="decimal"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                    />

                    <textarea
                      className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none min-h-[96px] focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Note (opzionale)"
                      value={itemNote}
                      onChange={(e) => setItemNote(e.target.value)}
                    />
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={addItem}
                      disabled={itemTitle.trim().length < 1}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-3 text-sm font-semibold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Aggiungi attività
                    </button>
                  </div>
                </GlassCard>
              </aside>

              {/* RIGHT */}
              <div className="lg:col-span-8 space-y-6">
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-base font-semibold">{openTrip.title}</div>
                      <div className="text-xs text-slate-200/70 mt-1">{openTrip.destination ?? "—"}</div>
                      {dayOver ? (
                        <div className="mt-3">
                          <Badge tone="danger">Oggi sei oltre il target</Badge>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {(openTrip.days ?? []).map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setActiveDayIndex(d.dayIndex)}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm",
                            d.dayIndex === activeDayIndex
                              ? "border-white/15 bg-white/[0.10] text-slate-50"
                              : "border-white/10 bg-white/[0.05] text-slate-200/80 hover:bg-white/[0.08]",
                          ].join(" ")}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {(activeDay?.items ?? []).length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-200/80">
                        Nessuna attività ancora. Aggiungine una a sinistra.
                      </div>
                    ) : (
                      (activeDay?.items ?? []).map((it) => (
                        <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold">{it.title}</div>
                            <div className="text-xs text-slate-200/70">{it.time ?? ""}</div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-200/80">
                            {typeof it.cost === "number" ? (
                              <span className="rounded-full bg-white/[0.06] px-2 py-1 border border-white/10">
                                € {it.cost}
                              </span>
                            ) : null}

                            {it.mapUrl ? (
                              <a
                                href={it.mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-white/[0.06] px-2 py-1 border border-white/10 hover:underline"
                              >
                                mappa
                              </a>
                            ) : null}
                          </div>

                          {it.note ? (
                            <div className="mt-2 text-sm text-slate-100/90 leading-relaxed">{it.note}</div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <TripChat tripId={openTrip.id} />
                </GlassCard>
              </div>
            </section>
          </div>
        ) : null}

        <footer className="mt-16 text-xs text-slate-200/70">©️ {new Date().getFullYear()} Wendenzo</footer>
      </div>
    </div>
  );
}