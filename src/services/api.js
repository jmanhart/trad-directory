import { supabase } from "./supabaseClient";

export async function fetchTattooShops() {
  const { data, error } = await supabase.from("trad_artists").select("*");
  if (error) throw error;
  return data;
}
