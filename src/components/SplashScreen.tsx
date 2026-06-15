"use client";

type Props = {
  fading?: boolean;
};

export function SplashScreen({ fading = false }: Props) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-sanddark transition-opacity duration-500 pointer-events-none"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="flex flex-col items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/poncha-icon.svg" alt="" className="size-[120px] shadow-xl rounded-[28px]" />
        <span className="font-display font-bold text-2xl text-ink tracking-tight">
          Best Poncha
        </span>
      </div>
    </div>
  );
}
