"use client";
import { useRef, useState } from "react";
import { Camera, ImageIcon, ImagePlus, Scaling, Trash2 } from "lucide-react";

type Props = {
  displayUrl: string | null;
  onChange: (file: File | null) => void;
  objectPosition?: string;
  onReposition?: () => void;
};

export function PhotoPicker({ displayUrl, onChange, objectPosition, onReposition }: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) onChange(file);
    e.target.value = "";
  }

  const hasPhoto = !!displayUrl;

  return (
    <div className="relative flex items-start gap-3">
      {/* Čtverec pro přidání/náhled fotky (100×100 dle Figma) */}
      <button
        type="button"
        onClick={() => setShowOptions((v) => !v)}
        className="size-[100px] rounded-xl border border-sanddark bg-cream flex items-center justify-center overflow-hidden shrink-0 transition hover:opacity-90 cursor-pointer"
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: objectPosition ?? "50% 50%" }}
          />
        ) : (
          <ImagePlus size={24} className="text-inksoft/50" />
        )}
      </button>

      {/* Akce vedle čtverce – Position / Remove (ztlumené, dokud není fotka) */}
      <div className="flex flex-col gap-2 justify-center self-stretch">
        <button
          type="button"
          disabled={!hasPhoto}
          onClick={onReposition}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-semibold text-inksoft transition ${
            hasPhoto ? "hover:bg-cream" : "opacity-50 cursor-default"
          }`}
        >
          <Scaling size={18} /> Position
        </button>
        <button
          type="button"
          disabled={!hasPhoto}
          onClick={() => onChange(null)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-semibold text-inksoft transition ${
            hasPhoto ? "hover:text-pinred" : "opacity-50 cursor-default"
          }`}
        >
          <Trash2 size={18} /> Remove
        </button>
      </div>

      {/* Volba zdroje fotky */}
      {showOptions && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
          <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-48 bg-white border border-sanddark rounded-2xl shadow-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-ink font-medium hover:bg-cream transition text-left"
              onClick={() => { setShowOptions(false); cameraRef.current?.click(); }}
            >
              <Camera size={18} className="text-inksoft shrink-0" />
              Camera
            </button>
            <div className="h-px bg-sanddark" />
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] text-ink font-medium hover:bg-cream transition text-left"
              onClick={() => { setShowOptions(false); galleryRef.current?.click(); }}
            >
              <ImageIcon size={18} className="text-inksoft shrink-0" />
              Gallery
            </button>
          </div>
        </>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
