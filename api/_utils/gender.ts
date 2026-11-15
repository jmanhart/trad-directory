// Resolve a gender write to a bucket. Prefers gender_id; falls back to mapping
// legacy free-text (sent by the chrome extension) to a bucket by slug/label.
// Returns the bucket so callers can dual-write gender_id + the legacy gender
// text column, keeping them in sync until the text column is dropped.
export async function resolveGenderBucket(
  supabase: any,
  input: { gender_id?: number | null; gender?: string | null }
): Promise<{ id: number; label: string } | null> {
  if (input.gender_id != null) {
    const { data } = await supabase
      .from("genders")
      .select("id, label")
      .eq("id", input.gender_id)
      .single();
    return data ? { id: data.id, label: data.label } : null;
  }
  const text = (input.gender ?? "").trim().toLowerCase();
  if (!text) return null;
  const { data } = await supabase.from("genders").select("id, label, slug");
  const match = (data || []).find(
    (g: any) => g.slug === text || String(g.label).toLowerCase() === text
  );
  return match ? { id: match.id, label: match.label } : null;
}
