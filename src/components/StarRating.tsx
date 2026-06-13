"use client";
import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  max?: number;
};

export function StarRating({ value, onChange, size = 20, max = 10 }: Props) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="flex flex-wrap gap-0.5">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} z ${max}`}
        >
          <Star
            size={size}
            className={n <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}
