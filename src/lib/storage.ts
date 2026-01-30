import type { Trip, TripDay, TripItem } from "@/types/trip";

const KEY = "wendy_trips_v1";
const LEGACY_KEY = "wendenzo_trips_v1";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function normalizeItem(raw: unknown): TripItem {
  const r = raw as any;

  const title = typeof r?.title === "string" ? r.title.trim() : "";
  return {
    id: typeof r?.id === "string" && r.id ? r.id : uid("item"),
    title: title || "Attività",
    time: typeof r?.time === "string" && r.time.trim() ? r.time.trim() : undefined,
    note: typeof r?.note === "string" && r.note.trim() ? r.note : undefined,
    mapUrl: typeof r?.mapUrl === "string" && r.mapUrl.trim() ? r.mapUrl.trim() : undefined,
    cost: isFiniteNumber(r?.cost) ? r.cost : undefined,
  };
}

function normalizeDay(raw: unknown, fallbackIndex: number): TripDay {
  const r = raw as any;

  const hasDayIndex = isFiniteNumber(r?.dayIndex);
  const dayIndex = hasDayIndex ? r.dayIndex : fallbackIndex;

  const label =
    typeof r?.label === "string" && r.label.trim()
      ? r.label.trim()
      : `Day ${dayIndex}`;

  const itemsRaw: unknown[] = Array.isArray(r?.items) ? r.items : [];
  const items = itemsRaw.map((it: unknown) => normalizeItem(it));

  return {
    id: typeof r?.id === "string" && r.id ? r.id : uid("day"),
    dayIndex,
    label,
    date: typeof r?.date === "string" && r.date.trim() ? r.date.trim() : undefined,
    items,
  };
}

function normalizeTrip(raw: unknown): Trip | null {
  const r = raw as any;
  if (!r) return null;

  const id = typeof r?.id === "string" && r.id ? r.id : uid("trip");
  const title = typeof r?.title === "string" ? r.title.trim() : "";
  if (!title) return null;

  const destination =
    typeof r?.destination === "string" && r.destination.trim()
      ? r.destination.trim()
      : undefined;

  const budget = isFiniteNumber(r?.budget) ? r.budget : undefined;
  const createdAt = isFiniteNumber(r?.createdAt) ? r.createdAt : Date.now();

  const daysRaw: unknown[] = Array.isArray(r?.days) ? r.days : [];
  const days: TripDay[] = daysRaw.map((d: unknown, idx: number) => normalizeDay(d, idx + 1));

  days.sort((a, b) => a.dayIndex - b.dayIndex);

  return {
    id,
    title,
    destination,
    startDate: typeof r?.startDate === "string" ? r.startDate : undefined,
    endDate: typeof r?.endDate === "string" ? r.endDate : undefined,
    budget,
    days,
    createdAt,
  };
}

function readRaw(key: string): unknown {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, trips: Trip[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(trips));
}

export function loadTrips(): Trip[] {
  if (typeof window === "undefined") return [];

  const current = readRaw(KEY);
  if (Array.isArray(current)) {
    const normalized = current.map((t: unknown) => normalizeTrip(t)).filter(Boolean) as Trip[];
    write(KEY, normalized);
    return normalized;
  }

  const legacy = readRaw(LEGACY_KEY);
  if (Array.isArray(legacy)) {
    const normalized = legacy.map((t: unknown) => normalizeTrip(t)).filter(Boolean) as Trip[];
    write(KEY, normalized);
    // non cancelliamo LEGACY_KEY per sicurezza
    return normalized;
  }

  return [];
}

export function saveTrips(trips: Trip[]) {
  write(KEY, trips);
}

export function getTrip(tripId: string): Trip | null {
  const trips = loadTrips();
  return trips.find((t) => t.id === tripId) ?? null;
}

export function upsertTrip(trip: Trip) {
  const trips = loadTrips();
  const normalized = normalizeTrip(trip) ?? trip;

  const idx = trips.findIndex((t) => t.id === normalized.id);
  if (idx >= 0) trips[idx] = normalized;
  else trips.unshift(normalized);

  trips.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  saveTrips(trips);
}

export function deleteTrip(tripId: string) {
  const trips = loadTrips().filter((t) => t.id !== tripId);
  saveTrips(trips);
}