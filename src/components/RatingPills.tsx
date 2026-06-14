"use client";

type Props = {
  value: number;
  onChange: (v: number) => void;
};

// Výběr hodnocení 1–10 jako řada koleček, vybrané je zelené a větší.
export function RatingPills({ value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between w-full">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = n === value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={
              active
                ? "flex items-center justify-center rounded-full size-[38px] bg-pingreen text-white text-base font-extrabold shrink-0 transition"
                : "flex items-center justify-center rounded-full size-[30px] bg-white border border-sanddark text-inksoft text-[13px] font-extrabold shrink-0 transition"
            }
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
