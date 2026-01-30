export type TripItem = {
  id: string;
  title: string;
  time?: string; // es "09:30"
  note?: string;
  mapUrl?: string;
  cost?: number;
};

export type TripDay = {
  id: string;
  dayIndex: number; // 1,2,3... (serve per ordine stabile)
  label: string; // es "Day 1"
  date?: string; // es "2026-01-30"
  items: TripItem[];
};

export type Trip = {
  id: string;
  title: string;
  destination?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  budget?: number;
  days: TripDay[];
  createdAt: number; // Date.now()
};