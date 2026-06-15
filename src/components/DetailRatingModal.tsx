"use client";
import { MapPin, Pencil } from "lucide-react";
import { RatingSheet, Section } from "./AddRatingModal";
import { RatingBadge } from "./RatingBadge";
import { updateRating } from "@/lib/ratings";
import type { PonchaRating } from "@/lib/supabase";

type Props = {
  rating: PonchaRating;
  onClose: () => void;
  onEdit: () => void;
  onUpdate?: (r: PonchaRating) => void;
};

function parseImgY(position: string | null): number {
  if (!position) return 50;
  const match = position.match(/[\d.]+%\s+([\d.]+)%/);
  return match ? parseFloat(match[1]) : 50;
}

export function DetailRatingModal({ rating, onClose, onEdit, onUpdate }: Props) {
  const ponchaTypes = rating.poncha_type
    ? rating.poncha_type.split(", ").filter(Boolean)
    : [];
  const tastes = rating.balance
    ? rating.balance.split(", ").filter(Boolean)
    : [];

  async function handleImgYChange(pct: number) {
    const photo_position = `50% ${pct.toFixed(1)}%`;
    try {
      const updated = await updateRating(rating.id, { photo_position });
      onUpdate?.(updated);
    } catch {
      // position save failure is non-critical
    }
  }

  return (
    <RatingSheet
      title={rating.place_name}
      onClose={onClose}
      topImage={rating.photo_url ?? undefined}
      initialImgY={parseImgY(rating.photo_position)}
      onImgYChange={handleImgYChange}
      action={
        <button
          onClick={onEdit}
          aria-label="Edit"
          className="text-sanddark hover:text-brand transition"
        >
          <Pencil size={20} />
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {rating.address && (
          <p className="flex items-center gap-1.5 text-[14px] text-inksoft -mt-4">
            <MapPin size={13} className="shrink-0 text-brand" />
            {rating.address}
          </p>
        )}

        <Section label="Rating">
          <div className="flex items-center gap-3">
            <RatingBadge
              value={rating.rating}
              className="min-w-[38px] h-[38px] text-xl rounded-xl"
            />
            <span className="text-sm text-inksoft">/ 10</span>
          </div>
        </Section>

        {ponchaTypes.length > 0 && (
          <Section label="Poncha type">
            <div className="flex flex-wrap gap-2">
              {ponchaTypes.map((t) => (
                <span
                  key={t}
                  className="px-4 py-2.5 rounded-full text-sm font-semibold bg-brand text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {tastes.length > 0 && (
          <Section label="Taste">
            <div className="flex flex-wrap gap-2">
              {tastes.map((t) => (
                <span
                  key={t}
                  className="px-4 py-2.5 rounded-full text-sm font-semibold bg-pingreen text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {rating.notes && (
          <Section label="Note">
            <p className="text-[15px] text-ink leading-relaxed">
              &ldquo;{rating.notes}&rdquo;
            </p>
          </Section>
        )}
      </div>
    </RatingSheet>
  );
}
