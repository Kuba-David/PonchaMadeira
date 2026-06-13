"use client";
import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { StarRating } from "./StarRating";
import { updateRating } from "@/lib/ratings";
import type { PonchaRating } from "@/lib/supabase";

const PONCHA_TYPES = ["Pescador", "Regional", "Maracujá", "Tangerina", "Other"];

type Props = {
  rating: PonchaRating;
  onClose: () => void;
  onSaved: (r: PonchaRating) => void;
};

export function EditRatingModal({ rating, onClose, onSaved }: Props) {
  const [placeName, setPlaceName] = useState(rating.place_name);
  const [address, setAddress] = useState(rating.address ?? "");
  const [score, setScore] = useState(rating.rating);
  const [ponchaTypes, setPonchaTypes] = useState<string[]>(
    rating.poncha_type ? rating.poncha_type.split(", ").filter(Boolean) : []
  );
  const [notes, setNotes] = useState(rating.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleType(t: string) {
    setPonchaTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!placeName.trim()) {
      setError("Název místa je povinný");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await updateRating(rating.id, {
        place_name: placeName.trim(),
        address: address.trim() || null,
        rating: score,
        poncha_type: ponchaTypes.join(", ") || null,
        notes: notes.trim() || null,
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
            Upravit hodnocení
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Název podniku *
            </label>
            <input
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
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
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Hodnocení</span>
              <span className="text-amber-600 font-semibold">{score}/10</span>
            </label>
            <StarRating value={score} onChange={setScore} size={26} max={10} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Druh ponchy
            </label>
            <div className="flex flex-wrap gap-2">
              {PONCHA_TYPES.map((t) => {
                const active = ponchaTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      active
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poznámky
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            {saving ? "Ukládám..." : "Uložit změny"}
          </button>
        </form>
      </div>
    </div>
  );
}
