"use client";
import { PinIcon, EditIcon } from "./icons";
import { RatingSheet, Section } from "./AddRatingModal";
import { RatingBadge } from "./RatingBadge";
import { RatingSlider } from "./RatingSlider";
import { BALANCE_STEPS, FRESHNESS_STEPS, slidersFrom, hasSliderData } from "@/lib/scoring";
import type { PonchaRating } from "@/lib/supabase";

type Props = {
  rating: PonchaRating;
  onClose: () => void;
  onEdit: () => void;
  onGoToMap: () => void;
};

function ReadRow({
  label,
  value,
  variant,
  steps,
}: {
  label: string;
  value: number;
  variant: "balance" | "freshness";
  steps: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-[84px] shrink-0 text-[15px] text-ink">{label}</span>
      <div className="flex-1">
        <RatingSlider value={value} steps={steps} variant={variant} label={label} readOnly />
      </div>
    </div>
  );
}

export function DetailRatingModal({ rating, onClose, onEdit, onGoToMap }: Props) {
  const ponchaTypes = rating.poncha_type
    ? rating.poncha_type.split(", ").filter(Boolean)
    : [];
  const tastes = rating.balance
    ? rating.balance.split(", ").filter(Boolean)
    : [];
  const useSliders = hasSliderData(rating);
  const sliders = slidersFrom(rating);

  return (
    <RatingSheet
      title={rating.place_name}
      onClose={onClose}
      onTitleClick={onGoToMap}
      topImage={rating.photo_url ?? undefined}
      imgPosition={rating.photo_position ?? undefined}
      action={
        <button
          onClick={onEdit}
          aria-label="Edit"
          className="text-inktertiary hover:text-brand transition"
        >
          <EditIcon size={18} />
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {rating.address && (
          <button
            onClick={onGoToMap}
            className="flex items-center gap-1.5 text-[14px] text-inksoft -mt-4 text-left hover:text-brand transition"
          >
            <PinIcon size={13} className="shrink-0 text-brand" />
            {rating.address}
          </button>
        )}

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

        {useSliders ? (
          <>
            <Section label="Balance">
              <ReadRow label="Sourness" value={sliders.sourness} variant="balance" steps={BALANCE_STEPS} />
              <ReadRow label="Sweetness" value={sliders.sweetness} variant="balance" steps={BALANCE_STEPS} />
              <ReadRow label="Booziness" value={sliders.booziness} variant="balance" steps={BALANCE_STEPS} />
            </Section>
            <Section label="Fresh or not?">
              <ReadRow label="Freshness" value={sliders.freshness} variant="freshness" steps={FRESHNESS_STEPS} />
            </Section>
          </>
        ) : (
          tastes.length > 0 && (
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
          )
        )}

        <Section label="Overall rating">
          <div className="flex items-center gap-3">
            <RatingBadge
              value={rating.rating}
              className="min-w-[38px] h-[38px] text-xl rounded-xl"
            />
            <span className="text-sm text-inksoft">/ 10</span>
          </div>
        </Section>

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
