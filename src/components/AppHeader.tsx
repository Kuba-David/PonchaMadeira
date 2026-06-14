import { Compass } from "lucide-react";

export function AppHeader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-6 pt-5 ${className}`}>
      <div className="size-8 rounded-lg bg-brand flex items-center justify-center shadow-md">
        <Compass size={20} className="text-white" />
      </div>
      <span className="font-display font-bold text-2xl text-ink tracking-tight drop-shadow-sm">
        Best Poncha
      </span>
    </div>
  );
}
