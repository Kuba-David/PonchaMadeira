"use client";
import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

type Props = {
  displayUrl: string | null;
  onChange: (file: File | null) => void;
};

export function PhotoPicker({ displayUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-[100px] rounded-xl border border-sanddark bg-cream flex flex-col items-center justify-center gap-2 overflow-hidden transition hover:opacity-90 cursor-pointer"
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <>
            <ImagePlus size={24} className="text-inksoft/60" />
            <div className="size-8 rounded-full border border-sanddark flex items-center justify-center">
              <span className="text-inksoft font-extrabold text-base leading-none">+</span>
            </div>
          </>
        )}
      </button>
      {displayUrl && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 size-7 rounded-full bg-black/50 flex items-center justify-center"
        >
          <X size={14} className="text-white" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) onChange(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
