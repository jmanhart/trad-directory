import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "./_middleware/auth";
import { geocodeCity } from "./_utils/geocode";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireAdminAuth(req, res)) return;

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

    // Re-geocode if city name or state changed
    if (data.city_name !== undefined || data.state_id !== undefined) {
      // Fetch current city to fill in any unchanged fields
      const { data: currentCity } = await supabase
        .from("cities")
        .select("city_name, state_id")
        .eq("id", id)
        .single();

      const cityName = data.city_name ?? currentCity?.city_name;
      const stateId = data.state_id !== undefined ? data.state_id : currentCity?.state_id;

      let stateName: string | null = null;
      let countryName: string | null = null;
      if (stateId) {
        const { data: stateRow } = await supabase
          .from("states")
          .select("state_name, country:countries(country_name)")
          .eq("id", stateId)
          .single();
        if (stateRow) {
          stateName = stateRow.state_name;
          const country = Array.isArray(stateRow.country)
            ? stateRow.country[0]
            : stateRow.country;
          countryName = (country as any)?.country_name || null;
        }
      }

      const coords = await geocodeCity(cityName, stateName, countryName);
      if (coords) {
        updateData.latitude = coords.lat;
        updateData.longitude = coords.lng;
      }
    }

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
    });
  }
}
