import { createClient } from "@supabase/supabase-js";

const ALLOWED_STATUSES = [
  "new",
  "in_progress",
  "resolved",
  "closed",
  "added",
  "deleted",
] as const;

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "PATCH" && req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { id, status } = req.body;

    if (!id) {
      res.status(400).json({ error: "Submission ID is required" });
      return;
    }

    if (
      !status ||
      typeof status !== "string" ||
      !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])
    ) {
      res.status(400).json({
        error: "Valid status is required",
        details: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      });
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

    const { data, error } = await supabase
      .from("submissions")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) {
      console.error("Supabase error updating submission:", error);
      res.status(500).json({
        error: "Database update failed",
        details: error.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      submission_id: id,
      status: data?.status,
      message: `Submission status updated to "${status}"`,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({
      error: "Failed to update submission",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
