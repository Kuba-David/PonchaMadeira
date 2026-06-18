import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export type PonchaRating = {
  id: string;
  created_at: string;
  place_name: string;
  address: string | null;
  rating: number;
  poncha_type: string | null;
  balance: string | null;
  sourness: number | null;
  sweetness: number | null;
  booziness: number | null;
  freshness: number | null;
  notes: string | null;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  photo_position: string | null;
};

export type NewPonchaRating = Omit<PonchaRating, "id" | "created_at">;
