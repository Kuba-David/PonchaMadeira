"use client";

type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
  /** barva vybraného stavu */
  color?: "brand" | "green";
};

export function Chip({ label, active, onClick, color = "brand" }: Props) {
  const activeClass =
    color === "green"
      ? "bg-pingreen border-pingreen text-white"
      : "bg-brand border-brand text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full border text-sm font-semibold transition ${
        active
          ? activeClass
          : "bg-cream border-sanddark text-inksoft hover:border-brandlight"
      }`}
    >
      {label}
    </button>
  );
}
