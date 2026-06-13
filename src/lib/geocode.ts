export type GeocodeResult = {
  placeName: string;
  address: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Tilequery queries rendered map tiles directly – works even when a POI
// is not in Mapbox's search index.
async function fetchNearbyPOIName(lat: number, lng: number): Promise<string> {
  const url =
    `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json` +
    `?radius=80&limit=10&access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const poi = (data.features ?? []).find(
      (f: { properties?: { name?: string; tilequery?: { layer?: string } } }) =>
        f.properties?.tilequery?.layer === "poi_label" && f.properties?.name
    );
    return poi?.properties?.name ?? "";
  } catch {
    return "";
  }
}

type ContextEntry = { id?: string; text?: string };

type GeoFeature = {
  text?: string;
  address?: string; // house number (v5 address features only)
  place_type?: string[];
  context?: ContextEntry[];
};

function ctxText(ctx: ContextEntry[] | undefined, prefix: string): string {
  return ctx?.find((c) => c.id?.startsWith(prefix + "."))?.text ?? "";
}

async function fetchAddress(lat: number, lng: number): Promise<string> {
  // v5 reverse geocoding without type filter – get the full feature hierarchy.
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${TOKEN}&limit=8`;
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const features: GeoFeature[] = (await res.json()).features ?? [];

    const byType = (t: string) => features.find((f) => f.place_type?.includes(t));

    // ── address feature: text = street name, address = house number ──
    const addr = byType("address");
    if (addr) {
      const street = addr.address
        ? `${addr.text ?? ""} ${addr.address}`.trim()
        : (addr.text ?? "");
      const city = ctxText(addr.context, "place");
      if (street) return [street, city].filter(Boolean).join(", ");
    }

    // ── POI feature: pick street/neighbourhood + city from context ──
    const poi = byType("poi");
    if (poi) {
      const street =
        ctxText(poi.context, "address") ||
        ctxText(poi.context, "neighborhood") ||
        ctxText(poi.context, "locality");
      const city = ctxText(poi.context, "place");
      if (street || city) return [street, city].filter(Boolean).join(", ");
    }

    // ── coarser fallbacks ──
    for (const type of ["neighborhood", "locality", "place"]) {
      const f = byType(type);
      if (f?.text) {
        const city = ctxText(f.context, "place");
        return city && city !== f.text ? `${f.text}, ${city}` : f.text;
      }
    }

    return "";
  } catch {
    return "";
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  if (!TOKEN) return { placeName: "", address: "" };
  try {
    const [placeName, address] = await Promise.all([
      fetchNearbyPOIName(lat, lng),
      fetchAddress(lat, lng),
    ]);
    return { placeName, address };
  } catch {
    return { placeName: "", address: "" };
  }
}
