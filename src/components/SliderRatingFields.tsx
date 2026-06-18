"use client";
import { RatingSlider } from "./RatingSlider";
import { RatingBadge } from "./RatingBadge";
import { BALANCE_STEPS, FRESHNESS_STEPS, computeRating, type Sliders } from "@/lib/scoring";

type Props = {
  value: Sliders;
  onChange: (s: Sliders) => void;
};

const BALANCE_ROWS: { key: keyof Sliders; label: string }[] = [
  { key: "sourness", label: "Sourness" },
  { key: "sweetness", label: "Sweetness" },
  { key: "booziness", label: "Booziness" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-extrabold uppercase tracking-wide text-inksoft">{children}</p>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-[84px] shrink-0 text-[15px] text-ink">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Balance (3 slidery) + Freshness + výsledné read-only hodnocení.
export function SliderRatingFields({ value, onChange }: Props) {
  const rating = computeRating(value);
  return (
    <>
      <div className="flex flex-col gap-4">
        <SectionLabel>Balance</SectionLabel>
        {BALANCE_ROWS.map(({ key, label }) => (
          <Row key={key} label={label}>
            <RatingSlider
              variant="balance"
              steps={BALANCE_STEPS}
              label={label}
              value={value[key]}
              onChange={(v) => onChange({ ...value, [key]: v })}
            />
          </Row>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <SectionLabel>Fresh or not?</SectionLabel>
        <Row label="Freshness">
          <RatingSlider
            variant="freshness"
            steps={FRESHNESS_STEPS}
            label="Freshness"
            value={value.freshness}
            onChange={(v) => onChange({ ...value, freshness: v })}
          />
        </Row>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Overall rating</SectionLabel>
        <div className="flex items-center gap-3">
          <RatingBadge value={rating} className="min-w-[38px] h-[38px] text-xl rounded-xl" />
          <span className="text-sm text-inksoft">/ 10</span>
        </div>
      </div>
    </>
  );
}
