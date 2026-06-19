"use client";

type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "brand" | "green";
  disabled?: boolean;
};

export function Chip({ label, active, onClick, color = "brand", disabled }: Props) {
  const activeClass =
    color === "green"
      ? "bg-pingreen border-pingreen text-white"
      : "bg-brand border-brand text-white";

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`px-4 py-2.5 rounded-full border text-sm font-semibold transition ${
        active
          ? activeClass
          : "border-sanddark text-inksoft"
      } ${disabled ? "cursor-default" : "hover:border-brandlight"}`}
    >
      {label}
    </button>
  );
}
