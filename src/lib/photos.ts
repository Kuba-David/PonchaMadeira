import { supabase } from "./supabase";

const BUCKET = "poncha-photos";
const MAX_WIDTH = 1200;
const QUALITY = 0.82;

async function compress(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", QUALITY);
    };
    img.src = url;
  });
}

// Vytáhne X a Y složky z uloženého formátu "X% Y%" nebo "X% Y% ZOOM".
export function parsePhotoX(position: string | null | undefined): number {
  if (!position) return 50;
  const m = position.match(/([\d.]+)%/);
  return m ? parseFloat(m[1]) : 50;
}

export function parsePhotoY(position: string | null | undefined): number {
  if (!position) return 50;
  const m = position.match(/[\d.]+%\s+([\d.]+)%/);
  return m ? parseFloat(m[1]) : 50;
}

// Třetí (nepovinná) hodnota v "X% Y% ZOOM" – výchozí 1 (žádný extra zoom).
export function parsePhotoZoom(position: string | null | undefined): number {
  if (!position) return 1;
  const parts = position.trim().split(/\s+/);
  if (parts.length < 3) return 1;
  const z = parseFloat(parts[2]);
  return isNaN(z) || z < 1 ? 1 : z;
}

export async function uploadPhoto(file: File): Promise<string> {
  const blob = await compress(file);
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
