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
      res.status(400).json({ error: "Country ID is required" });
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
    if (data.country_name !== undefined)
      updateData.country_name = data.country_name;
    if (data.country_code !== undefined)
      updateData.country_code =
        data.country_code && String(data.country_code).trim() !== ""
          ? String(data.country_code).trim()
          : "";

    const { data: updated, error } = await supabase
      .from("countries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating country:", error);
      res.status(500).json({
        error: "Database update failed",
        details: error.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      country_id: id,
      message: `Country "${data.country_name ?? updated?.country_name}" updated successfully`,
    });
  } catch (error) {
    console.error("Error updating country:", error);
    res.status(500).json({
      error: "Failed to update country",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
