"use client";
import { useState } from "react";
import { RatingPills } from "./RatingPills";
import { Chip } from "./Chip";
import { RatingSheet, Section, PlaceFields } from "./AddRatingModal";
import { updateRating } from "@/lib/ratings";
import { PONCHA_TYPES, BALANCE_OPTIONS } from "@/lib/options";
import type { PonchaRating } from "@/lib/supabase";

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
  const [taste, setTaste] = useState<string[]>(
    rating.balance ? rating.balance.split(", ").filter(Boolean) : []
  );
  const [notes, setNotes] = useState(rating.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleType(t: string) {
    setPonchaTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function toggleTaste(t: string) {
    setTaste((prev) =>
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
        balance: taste.join(", ") || null,
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
    <RatingSheet title="Upravit hodnocení" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <PlaceFields
          placeName={placeName}
          address={address}
          geoLoading={false}
          onName={setPlaceName}
          onAddress={setAddress}
        />

        <Section label="Hodnocení">
          <RatingPills value={score} onChange={setScore} />
        </Section>

        <Section label="Typ ponchy">
          <div className="flex flex-wrap gap-2">
            {PONCHA_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                active={ponchaTypes.includes(t)}
                onClick={() => toggleType(t)}
              />
            ))}
          </div>
        </Section>

        <Section label="Chuť">
          <div className="flex flex-wrap gap-2">
            {BALANCE_OPTIONS.map((b) => (
              <Chip
                key={b}
                label={b}
                color="green"
                active={taste.includes(b)}
                onClick={() => toggleTaste(b)}
              />
            ))}
          </div>
        </Section>

        <Section label="Poznámka">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Přidejte poznámku k ponše..."
            rows={3}
            className="w-full bg-cream border border-sanddark rounded-xl p-4 text-[15px] text-ink placeholder:text-inksoft/60 focus:outline-none focus:border-brandlight resize-none"
          />
        </Section>

        {error && <p className="text-pinred text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="h-14 rounded-full bg-brand text-white font-bold text-base disabled:opacity-50 transition"
        >
          {saving ? "Ukládám..." : "Uložit změny"}
        </button>
      </form>
    </RatingSheet>
  );
}
