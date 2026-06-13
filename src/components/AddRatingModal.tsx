"use client";
import { useEffect, useState } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import { StarRating } from "./StarRating";
import { addRating } from "@/lib/ratings";
import { reverseGeocode } from "@/lib/geocode";
import type { PonchaRating } from "@/lib/supabase";

const PONCHA_TYPES = [
  "Tradicionální (aguardente + mel + limão)",
  "Maracujá",
  "Maracujá s malinami",
  "Laranja",
  "Limão",
  "Morango",
  "Passionfruit",
  "Jiné",
];

type Props = {
  lat: number;
  lng: number;
  onClose: () => void;
  onSaved: (r: PonchaRating) => void;
};

export function AddRatingModal({ lat, lng, onClose, onSaved }: Props) {
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [rating, setRating] = useState(3);
  const [ponchaType, setPonchaType] = useState(PONCHA_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [geoLoading, setGeoLoading] = useState(true);

  // Po otevření zkusíme z mapy automaticky načíst název podniku a adresu
  useEffect(() => {
    let active = true;
    reverseGeocode(lat, lng)
      .then((res) => {
        if (!active) return;
        // Nepřepisujeme, pokud už uživatel mezitím něco napsal
        if (res.placeName) setPlaceName((prev) => prev || res.placeName);
        if (res.address) setAddress((prev) => prev || res.address);
      })
      .finally(() => {
        if (active) setGeoLoading(false);
      });
    return () => {
      active = false;
    };
  }, [lat, lng]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!placeName.trim()) {
      setError("Název místa je povinný");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await addRating({
        place_name: placeName.trim(),
        address: address.trim() || null,
        rating,
        poncha_type: ponchaType,
        notes: notes.trim() || null,
        latitude: lat,
        longitude: lng,
        photo_url: null,
      });
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Chyba při ukládání");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-amber-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <MapPin size={20} />
            Přidat hodnocení ponchy
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-gray-400 flex gap-1 items-center">
            <MapPin size={12} />
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>

          {geoLoading && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <Loader2 size={12} className="animate-spin" />
              Načítám místo z mapy…
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Název podniku *
            </label>
            <input
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="např. Barreirinha Bar Café"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresa
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ulice, Funchal"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hodnocení
            </label>
            <StarRating value={rating} onChange={setRating} size={32} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Druh ponchy
            </label>
            <select
              value={ponchaType}
              onChange={(e) => setPonchaType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {PONCHA_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poznámky
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chuť, atmosféra, doporučení..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition"
          >
            {saving ? "Ukládám..." : "Uložit hodnocení"}
          </button>
        </form>
      </div>
    </div>
  );
}
