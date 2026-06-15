export function AppHeader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-6 pt-5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/poncha-icon.svg" alt="" className="size-8 rounded-lg shadow-md" />
      <span className="font-display font-bold text-2xl text-ink tracking-tight drop-shadow-sm">
        Best Poncha
      </span>
    </div>
  );
}
