export type TripItem = {
  id: string;
  title: string;
  time?: string;
  mapUrl?: string;
  cost?: number;
  note?: string;

  // ✅ WOW: task completion
  done?: boolean;
};

export type TripDay = {
  id: string;
  dayIndex: number;
  label: string;
  date?: string;
  items: TripItem[];
};

export type Trip = {
  id: string;
  title: string;
  destination?: string;
  budget?: number;
  createdAt?: number;
  days: TripDay[];
};
