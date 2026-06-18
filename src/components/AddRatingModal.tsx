"use client";
import { useEffect, useRef, useState } from "react";
import { AddressLoaderIcon } from "./icons";
import { Chip } from "./Chip";
import { PhotoPicker } from "./PhotoPicker";
import { PhotoPositionModal } from "./PhotoPositionModal";
import { SliderRatingFields } from "./SliderRatingFields";
import { addRating } from "@/lib/ratings";
import { uploadPhoto, parsePhotoX, parsePhotoY, parsePhotoZoom } from "@/lib/photos";
import { reverseGeocode } from "@/lib/geocode";
import { PONCHA_TYPES } from "@/lib/options";
import { DEFAULT_SLIDERS, computeRating, type Sliders } from "@/lib/scoring";
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
  const [ponchaTypes, setPonchaTypes] = useState<string[]>([]);
  const [sliders, setSliders] = useState<Sliders>(DEFAULT_SLIDERS);
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPosition, setPhotoPosition] = useState("50% 50%");
  const [showPositionModal, setShowPositionModal] = useState(false);
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

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  function handlePhotoChange(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoPosition("50% 50%");
      setShowPositionModal(true);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }

  function toggleType(t: string) {
    setPonchaTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!placeName.trim()) {
      setError("Place name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let photo_url: string | null = null;
      if (photoFile) photo_url = await uploadPhoto(photoFile);
      const saved = await addRating({
        place_name: placeName.trim(),
        address: address.trim() || null,
        rating: computeRating(sliders),
        poncha_type: ponchaTypes.join(", ") || null,
        balance: null,
        sourness: sliders.sourness,
        sweetness: sliders.sweetness,
        booziness: sliders.booziness,
        freshness: sliders.freshness,
        notes: notes.trim() || null,
        latitude: lat,
        longitude: lng,
        photo_url,
        photo_position: photo_url ? photoPosition : null,
      });
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error while saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <RatingSheet title="Rate poncha" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <PlaceFields
          placeName={placeName}
          address={address}
          geoLoading={geoLoading}
          onName={setPlaceName}
          onAddress={setAddress}
        />

        <Section label="Poncha type">
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

        <SliderRatingFields value={sliders} onChange={setSliders} />

        <Section label="Photos">
          <PhotoPicker
            displayUrl={photoPreview}
            onChange={handlePhotoChange}
            objectPosition={photoPosition}
            onReposition={() => setShowPositionModal(true)}
          />
        </Section>

        <Section label="Note">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note about the poncha..."
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
          {saving ? (photoFile ? "Uploading photo…" : "Saving...") : "Save rating"}
        </button>
      </form>
    </RatingSheet>

    {showPositionModal && photoPreview && (
      <PhotoPositionModal
        imageUrl={photoPreview}
        initialX={parsePhotoX(photoPosition)}
        initialY={parsePhotoY(photoPosition)}
        initialZoom={parsePhotoZoom(photoPosition)}
        onConfirm={(x, y, z) => {
          setPhotoPosition(`${x.toFixed(1)}% ${y.toFixed(1)}% ${z.toFixed(3)}`);
          setShowPositionModal(false);
        }}
        onCancel={() => setShowPositionModal(false)}
      />
    )}
    </>
  );
}

/* ── Sdílené prvky panelu ── */

// Extrahuje "X% Y%" část z formátu "X% Y% ZOOM" (kompatibilní s oběma formáty).
function parseObjPos(position: string | undefined): string {
  if (!position) return "50% 50%";
  const m = position.match(/([\d.]+%)\s+([\d.]+%)/);
  return m ? `${m[1]} ${m[2]}` : "50% 50%";
}

function parseZoomVal(position: string | undefined): number {
  if (!position) return 1;
  const parts = position.trim().split(/\s+/);
  if (parts.length < 3) return 1;
  const z = parseFloat(parts[2]);
  return isNaN(z) || z < 1 ? 1 : z;
}

export function RatingSheet({
  title,
  onClose,
  onTitleClick,
  action,
  children,
  topImage,
  imgPosition,
}: {
  title: string;
  onClose: () => void;
  onTitleClick?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
  topImage?: string;
  imgPosition?: string;
}) {
  const startYRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // null = ještě nerozhodnuto, true = zavírací tah, false = běžné scrollování
  const dragLockRef = useRef<boolean | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);

  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
    // Tah mimo scrollovací oblast (úchyt / hero foto) zavírá vždy.
    const inScroll = scrollRef.current?.contains(e.target as Node) ?? false;
    dragLockRef.current = inScroll ? null : true;
    setDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    // Uvnitř scrollu zavíráme jen když je obsah nahoře a táhne se dolů.
    if (dragLockRef.current === null) {
      const atTop = (scrollRef.current?.scrollTop ?? 0) <= 0;
      if (delta > 4 && atTop) dragLockRef.current = true;
      else if (delta < -4 || !atTop) dragLockRef.current = false;
    }
    if (dragLockRef.current) setDragY(Math.max(0, delta));
  }

  function handleTouchEnd() {
    if (startYRef.current === null) return;
    startYRef.current = null;
    dragLockRef.current = null;
    setDragging(false);
    if (dragY > 180) {
      setClosing(true);
      setDragY(window.innerHeight);
      setTimeout(onClose, 260);
    } else {
      setDragY(0);
    }
  }

  // průhlednost pozadí podle tažení (max ~30 % zeslabení)
  const backdropOpacity = closing ? 0 : Math.max(0.4 - dragY / 800, 0.12);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        backgroundColor: `rgba(0,0,0,${backdropOpacity})`,
        transition: dragging ? "none" : "background-color 0.26s ease",
      }}
      onClick={onClose}
    >
      <div
        className="bg-cream w-full max-w-md rounded-t-3xl max-h-[92dvh] flex flex-col overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.26s cubic-bezier(0.32,0.72,0,1)",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {topImage ? (
          <div className="relative w-full shrink-0 overflow-hidden" style={{ height: 260 }}>
            <img
              src={topImage}
              alt=""
              className="w-full h-full object-cover"
              style={{
                objectPosition: parseObjPos(imgPosition),
                transform: `scale(${parseZoomVal(imgPosition)})`,
                transformOrigin: parseObjPos(imgPosition),
              }}
            />
            {/* Úchyt pro zavření – přes fotku, zavíráme kartu odshora */}
            <div className="absolute top-0 left-0 w-full flex justify-center pt-2.5 pb-4 pointer-events-none">
              <div className="h-1 w-10 rounded-full bg-white/80 shadow-sm" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-2.5 pb-2 shrink-0">
            <div className="h-1 w-10 rounded-full bg-sanddark" />
          </div>
        )}

        <div
          ref={scrollRef}
          className="overflow-y-auto flex-1 px-6 pt-4 pb-10"
          style={{ overscrollBehavior: "contain" }}
        >
          <div className="flex items-center justify-between mb-6">
            {onTitleClick ? (
              <button
                onClick={onTitleClick}
                className="font-display font-bold text-2xl text-ink text-left hover:text-brand transition"
              >
                {title}
              </button>
            ) : (
              <h2 className="font-display font-bold text-2xl text-ink">{title}</h2>
            )}
            {action}
          </div>
          {children}
        </div>
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
        placeholder="Place name *"
        className="w-full bg-white border border-sanddark rounded-2xl px-4 py-3 text-[15px] font-semibold text-ink placeholder:text-inksoft/60 focus:outline-none focus:border-brandlight"
      />
      <input
        value={address}
        onChange={(e) => onAddress(e.target.value)}
        placeholder="Address"
        className="w-full bg-white border border-sanddark rounded-2xl px-4 py-3 text-[14px] text-inksoft placeholder:text-inksoft/60 focus:outline-none focus:border-brandlight"
      />
      {geoLoading && (
        <div className="flex items-center gap-1.5 text-xs text-brand">
          <AddressLoaderIcon size={12} className="animate-spin" />
          Loading place from map…
        </div>
      )}
    </div>
  );
}
