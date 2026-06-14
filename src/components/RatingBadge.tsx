type Props = {
  value: number;
  className?: string;
};

export function ratingColorClass(value: number): string {
  if (value >= 8) return "bg-pingreen";
  if (value >= 5) return "bg-pinorange";
  return "bg-pinred";
}

export function RatingBadge({ value, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-lg text-white font-extrabold text-sm shrink-0 ${ratingColorClass(
        value
      )} ${className}`}
    >
      {value}
    </span>
  );
}
