import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { id, ...data } = req.body;

    if (!id) {
      res.status(400).json({ error: "City ID is required" });
      return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const updateData: any = {};
    if (data.city_name !== undefined) updateData.city_name = data.city_name;
    if (data.state_id !== undefined) updateData.state_id = data.state_id || null;

    const { data: updated, error } = await supabase
      .from("cities")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating city:", error);
      res.status(500).json({
        error: "Database update failed",
        details: error.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      city_id: id,
      message: `City "${data.city_name ?? updated?.city_name}" updated successfully`,
    });
  } catch (error) {
    console.error("Error updating city:", error);
    res.status(500).json({
      error: "Failed to update city",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
