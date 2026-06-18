"use client";
import { useRef, useState } from "react";
import { AddImageIcon, PositionIcon, RemoveIcon } from "./icons";
import { PhotoSourceModal } from "./PhotoSourceModal";

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
          <AddImageIcon size={24} className="text-inksoft/50" />
        )}
      </button>

      {/* Akce vedle čtverce – Position / Remove (ztlumené, dokud není fotka) */}
      <div className="flex flex-col gap-2 justify-center self-stretch">
        <button
          type="button"
          disabled={!hasPhoto}
          onClick={onReposition}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-semibold text-inksoft/60 transition ${
            hasPhoto ? "hover:bg-cream" : "opacity-50 cursor-default"
          }`}
        >
          <PositionIcon size={18} /> Position
        </button>
        <button
          type="button"
          disabled={!hasPhoto}
          onClick={() => onChange(null)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-semibold text-inksoft/60 transition ${
            hasPhoto ? "hover:text-pinred" : "opacity-50 cursor-default"
          }`}
        >
          <RemoveIcon size={18} /> Remove
        </button>
      </div>

      {/* Volba zdroje fotky */}
      {showOptions && (
        <PhotoSourceModal
          onCamera={() => { setShowOptions(false); cameraRef.current?.click(); }}
          onGallery={() => { setShowOptions(false); galleryRef.current?.click(); }}
          onClose={() => setShowOptions(false)}
        />
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
