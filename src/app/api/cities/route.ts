export const runtime = "nodejs";

type CityResult = {
  label: string;
  city: string;
  region?: string;
  country: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const country = (searchParams.get("country") ?? "").trim(); // ISO2

  if (q.length < 2) return Response.json([]);

  const cc = country ? country.toLowerCase() : "";
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=jsonv2&addressdetails=1&limit=8` +
    (cc ? `&countrycodes=${encodeURIComponent(cc)}` : "") +
    `&q=${encodeURIComponent(q)}`;

  const r = await fetch(url, {
    headers: {
      "User-Agent": "WendyTripPlanner/1.0 (contact: you@example.com)",
      "Accept-Language": "it",
    },
    next: { revalidate: 3600 },
  });

  if (!r.ok) return Response.json([]);

  const raw = (await r.json()) as any[];

  const out: CityResult[] = raw
    .map((x) => {
      const a = x.address ?? {};

      const city = a.city || a.town || a.village || a.municipality || a.hamlet;
      if (!city) return null;

      const region = a.state || a.region || a.county;
      const countryName = a.country || "";

      const label = [city, region].filter(Boolean).join(", ");
      return { label, city, region, country: countryName } as CityResult;
    })
    .filter((v): v is CityResult => v != null);


  return new Response(JSON.stringify(out), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
