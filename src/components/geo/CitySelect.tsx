"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CityResult = {
  label: string;
  city: string;
  region?: string;
  country: string;
};

export function CitySelect({
  countryCode,
  value,
  onChange,
  placeholder = "Città (scrivi per cercare)",
}: {
  countryCode: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  useEffect(() => {
    if (!canSearch) {
      setItems([]);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/cities?country=${encodeURIComponent(countryCode)}&q=${encodeURIComponent(query.trim())}`;
        const r = await fetch(url);
        const data = (await r.json()) as CityResult[];
        setItems(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, countryCode, canSearch]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          className={[
            "w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur px-4 py-3 text-sm outline-none",
            "text-slate-100 placeholder:text-slate-200/50",
            "focus:ring-2 focus:ring-indigo-500/25 focus:border-white/15",
          ].join(" ")}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 140)}
        />

        {/* mini status */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-200/60">
          {loading ? "…" : query.trim().length >= 2 ? "↵" : ""}
        </div>
      </div>

      {open && (loading || items.length > 0) ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-200/80">Cerco città…</div>
          ) : (
            <>
              <div className="px-4 py-2 text-[11px] text-slate-200/60 border-b border-white/10">
                Risultati ({items.length})
              </div>

              <div className="max-h-72 overflow-auto">
                {items.map((it, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-white/[0.06] focus:outline-none"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(it.label);
                      setQuery(it.label);
                      setOpen(false);
                    }}
                  >
                    <div className="font-semibold text-slate-100">{it.label}</div>
                    <div className="text-xs text-slate-200/60">{it.country}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}