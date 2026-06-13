"use client";
import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 24 }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} hvězd`}
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
