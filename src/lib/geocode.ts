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

type V6Context = {
  address?: { street_name?: string; address_number?: string; name?: string };
  street?: { name?: string };
  neighborhood?: { name?: string };
  place?: { name?: string };
};

type V6Feature = {
  properties?: {
    feature_type?: string;
    name?: string;
    full_address?: string;
    context?: V6Context;
  };
};

// Geocoding v6 returns clean structured fields – no postal-code regex needed.
async function fetchAddress(lat: number, lng: number): Promise<string> {
  const url =
    `https://api.mapbox.com/search/geocode/v6/reverse` +
    `?longitude=${lng}&latitude=${lat}` +
    `&types=address,street,neighborhood,locality,place` +
    `&limit=5&access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const features: V6Feature[] = data.features ?? [];

    const byType = (t: string) =>
      features.find((f) => f.properties?.feature_type === t);

    const best =
      byType("address") ??
      byType("street") ??
      byType("neighborhood") ??
      byType("locality") ??
      byType("place") ??
      features[0];

    if (!best?.properties) return "";

    const ctx = best.properties.context ?? {};
    const city = ctx.place?.name ?? "";

    // Build address from structured context: "Rua do Bom Jesus 45, Funchal"
    if (ctx.address) {
      const street = ctx.address.street_name ?? ctx.address.name ?? "";
      const number = ctx.address.address_number ?? "";
      const streetFull = number ? `${street} ${number}`.trim() : street;
      return [streetFull, city].filter(Boolean).join(", ");
    }

    if (ctx.street?.name) {
      return [ctx.street.name, city].filter(Boolean).join(", ");
    }

    if (ctx.neighborhood?.name) {
      return [ctx.neighborhood.name, city].filter(Boolean).join(", ");
    }

    if (city) return city;

    // Last resort: strip country/region from full_address
    return (best.properties.full_address ?? best.properties.name ?? "")
      .replace(/,\s*\d{4}-\d{3}\s*/g, ", ")
      .replace(/,\s*Madeira\s*,\s*Portugal\s*$/i, "")
      .replace(/,\s*Portugal\s*$/i, "")
      .replace(/,\s*Madeira\s*$/i, "")
      .trim();
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
