"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { RatingPills } from "./RatingPills";
import { Chip } from "./Chip";
import { addRating } from "@/lib/ratings";
import { reverseGeocode } from "@/lib/geocode";
import { PONCHA_TYPES, BALANCE_OPTIONS } from "@/lib/options";
import type { PonchaRating } from "@/lib/supabase";

type Props = {
  lat: number;
  lng: number;
  onClose: () => void;
  onSaved: (r: PonchaRating) => void;
};

export function AddRatingModal({ lat, lng, onClose, onSaved }: Props) {
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [rating, setRating] = useState(8);
  const [ponchaTypes, setPonchaTypes] = useState<string[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    let active = true;
    reverseGeocode(lat, lng)
      .then((res) => {
        if (!active) return;
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
      const saved = await addRating({
        place_name: placeName.trim(),
        address: address.trim() || null,
        rating,
        poncha_type: ponchaTypes.join(", ") || null,
        balance,
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
    <RatingSheet title="Ohodnotit ponchu" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <PlaceFields
          placeName={placeName}
          address={address}
          geoLoading={geoLoading}
          onName={setPlaceName}
          onAddress={setAddress}
        />

        <Section label="Hodnocení">
          <RatingPills value={rating} onChange={setRating} />
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

        <Section label="Vyváženost">
          <div className="flex flex-wrap gap-2">
            {BALANCE_OPTIONS.map((b) => (
              <Chip
                key={b}
                label={b}
                color="green"
                active={balance === b}
                onClick={() => setBalance((prev) => (prev === b ? null : b))}
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
          {saving ? "Ukládám..." : "Uložit hodnocení"}
        </button>
      </form>
    </RatingSheet>
  );
}

/* ── Sdílené prvky panelu ── */

export function RatingSheet({
  title,
  onClose,
  action,
  children,
}: {
  title: string;
  onClose: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";
    return () => { document.body.style.overscrollBehavior = prev; };
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const delta = e.changedTouches[0].clientY - startYRef.current;
    startYRef.current = null;
    if (delta > 60) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-cream w-full max-w-md rounded-t-3xl px-6 pt-3 pb-10 max-h-[92dvh] overflow-y-auto shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-center pb-3 cursor-grab"
          style={{ touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-1 w-10 rounded-full bg-sanddark" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-2xl text-ink">{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-extrabold uppercase tracking-wide text-inksoft">
        {label}
      </p>
      {children}
    </div>
  );
}

export function PlaceFields({
  placeName,
  address,
  geoLoading,
  onName,
  onAddress,
}: {
  placeName: string;
  address: string;
  geoLoading: boolean;
  onName: (v: string) => void;
  onAddress: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <input
        value={placeName}
        onChange={(e) => onName(e.target.value)}
        placeholder="Název podniku *"
        className="w-full bg-white border border-sanddark rounded-2xl px-4 py-3 text-[15px] font-semibold text-ink placeholder:text-inksoft/60 focus:outline-none focus:border-brandlight"
      />
      <input
        value={address}
        onChange={(e) => onAddress(e.target.value)}
        placeholder="Adresa"
        className="w-full bg-white border border-sanddark rounded-2xl px-4 py-3 text-[14px] text-inksoft placeholder:text-inksoft/60 focus:outline-none focus:border-brandlight"
      />
      {geoLoading && (
        <div className="flex items-center gap-1.5 text-xs text-brand">
          <Loader2 size={12} className="animate-spin" />
          Načítám místo z mapy…
        </div>
      )}
    </div>
  );
}
