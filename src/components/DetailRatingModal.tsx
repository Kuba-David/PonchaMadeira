"use client";
import { MapPin, Pencil } from "lucide-react";
import { RatingSheet, Section } from "./AddRatingModal";
import { RatingBadge } from "./RatingBadge";
import { Chip } from "./Chip";
import { PONCHA_TYPES, BALANCE_OPTIONS } from "@/lib/options";
import type { PonchaRating } from "@/lib/supabase";

type Props = {
  rating: PonchaRating;
  onClose: () => void;
  onEdit: () => void;
};

export function DetailRatingModal({ rating, onClose, onEdit }: Props) {
  const ponchaTypes = rating.poncha_type
    ? rating.poncha_type.split(", ").filter(Boolean)
    : [];

  return (
    <RatingSheet
      title={rating.place_name}
      onClose={onClose}
      action={
        <button
          onClick={onEdit}
          aria-label="Upravit"
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

        <Section label="Hodnocení">
          <div className="flex items-center gap-3">
            <RatingBadge
              value={rating.rating}
              className="min-w-[38px] h-[38px] text-xl rounded-xl"
            />
            <span className="text-sm text-inksoft">{rating.rating} / 10</span>
          </div>
        </Section>

        {ponchaTypes.length > 0 && (
          <Section label="Typ ponchy">
            <div className="flex flex-wrap gap-2">
              {PONCHA_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={ponchaTypes.includes(t)}
                  onClick={() => {}}
                  disabled
                />
              ))}
            </div>
          </Section>
        )}

        {rating.balance && (
          <Section label="Vyváženost">
            <div className="flex flex-wrap gap-2">
              {BALANCE_OPTIONS.map((b) => (
                <Chip
                  key={b}
                  label={b}
                  color="green"
                  active={rating.balance === b}
                  onClick={() => {}}
                  disabled
                />
              ))}
            </div>
          </Section>
        )}

        {rating.notes && (
          <Section label="Poznámka">
            <p className="text-[15px] text-ink leading-relaxed">
              &ldquo;{rating.notes}&rdquo;
            </p>
          </Section>
        )}

        <button
          onClick={onEdit}
          className="h-14 rounded-full bg-brand text-white font-bold text-base transition hover:opacity-90"
        >
          Upravit hodnocení
        </button>
      </div>
    </RatingSheet>
  );
}
