"use client";
import { useEffect, useState } from "react";
import { Chip } from "./Chip";
import { PhotoPicker } from "./PhotoPicker";
import { PhotoPositionModal } from "./PhotoPositionModal";
import { RatingSheet, Section, PlaceFields } from "./AddRatingModal";
import { SliderRatingFields } from "./SliderRatingFields";
import { updateRating } from "@/lib/ratings";
import { uploadPhoto, parsePhotoX, parsePhotoY, parsePhotoZoom } from "@/lib/photos";
import { PONCHA_TYPES } from "@/lib/options";
import { computeRating, slidersFrom, type Sliders } from "@/lib/scoring";
import type { PonchaRating } from "@/lib/supabase";

type Props = {
  rating: PonchaRating;
  onClose: () => void;
  onSaved: (r: PonchaRating) => void;
};

export function EditRatingModal({ rating, onClose, onSaved }: Props) {
  const [placeName, setPlaceName] = useState(rating.place_name);
  const [address, setAddress] = useState(rating.address ?? "");
  const [ponchaTypes, setPonchaTypes] = useState<string[]>(
    rating.poncha_type ? rating.poncha_type.split(", ").filter(Boolean) : []
  );
  const [sliders, setSliders] = useState<Sliders>(slidersFrom(rating));
  const [notes, setNotes] = useState(rating.notes ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoPosition, setPhotoPosition] = useState(rating.photo_position ?? "50% 50%");
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const photoDisplayUrl = photoPreview ?? (removePhoto ? null : rating.photo_url);

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  function handlePhotoChange(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setRemovePhoto(false);
      setPhotoPosition("50% 50%");
      setShowPositionModal(true);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
      setRemovePhoto(true);
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
      let photo_url: string | null | undefined = undefined;
      if (photoFile) photo_url = await uploadPhoto(photoFile);
      else if (removePhoto) photo_url = null;

      // Pozici ukládáme i při pouhé úpravě výřezu existující fotky.
      const hasPhoto = !!photoFile || (!!rating.photo_url && !removePhoto);
      const photo_position = removePhoto ? null : hasPhoto ? photoPosition : undefined;

      const saved = await updateRating(rating.id, {
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
        ...(photo_url !== undefined ? { photo_url } : {}),
        ...(photo_position !== undefined ? { photo_position } : {}),
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
    <RatingSheet title="Edit rating" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <PlaceFields
          placeName={placeName}
          address={address}
          geoLoading={false}
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
            displayUrl={photoDisplayUrl}
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
          {saving ? (photoFile ? "Uploading photo…" : "Saving...") : "Save changes"}
        </button>
      </form>
    </RatingSheet>

    {showPositionModal && photoDisplayUrl && (
      <PhotoPositionModal
        imageUrl={photoDisplayUrl}
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
