import { supabase, type NewPonchaRating, type PonchaRating } from "./supabase";

export async function getRatings(): Promise<PonchaRating[]> {
  const { data, error } = await supabase
    .from("poncha_ratings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addRating(rating: NewPonchaRating): Promise<PonchaRating> {
  const { data, error } = await supabase
    .from("poncha_ratings")
    .insert(rating)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRating(id: string): Promise<void> {
  const { error } = await supabase.from("poncha_ratings").delete().eq("id", id);
  if (error) throw error;
}
