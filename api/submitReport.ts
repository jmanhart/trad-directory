import { createClient } from "@supabase/supabase-js";

interface ReportSubmission {
  submission_type: "report" | "new_artist";
  
  // For reports
  entity_type?: "artist" | "shop";
  entity_id?: string;
  changes?: Record<string, { current: string; suggested: string }>;
  
  // For new_artist
  artist_name?: string;
  artist_instagram_handle?: string;
  artist_city?: string;
  artist_state?: string;
  artist_country?: string;
  artist_shop_name?: string;
  artist_shop_instagram_handle?: string;
  
  // Shared
  details?: string;
  reporter_email?: string;
  page_url: string;
  
  // Turnstile token (optional for now)
  turnstile_token?: string;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Check if environment variables are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error("Missing Supabase environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const data: ReportSubmission = req.body;

    // Validate required fields
    if (!data.submission_type || !data.page_url) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Validate submission_type
    if (!["report", "new_artist"].includes(data.submission_type)) {
      res.status(400).json({ error: "Invalid submission_type" });
      return;
    }

    // Verify Turnstile token
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!data.turnstile_token) {
        res.status(400).json({ error: "Security verification required" });
        return;
      }

      try {
        const verifyResponse = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret: process.env.TURNSTILE_SECRET_KEY,
              response: data.turnstile_token,
            }),
          }
        );
        const verifyResult = await verifyResponse.json();
        
        if (!verifyResult.success) {
          console.error("Turnstile verification failed:", verifyResult);
          res.status(400).json({ 
            error: "Security verification failed. Please try again.",
            details: verifyResult["error-codes"] || []
          });
          return;
        }
      } catch (verifyError) {
        console.error("Turnstile verification error:", verifyError);
        res.status(500).json({ error: "Failed to verify security token" });
        return;
      }
    } else {
      console.warn("TURNSTILE_SECRET_KEY not set - skipping verification");
    }

    // Prepare submission data for database
    const submissionData: any = {
      submission_type: data.submission_type,
      page_url: data.page_url,
      details: data.details || null,
      reporter_email: data.reporter_email || null,
      status: "new",
    };

    if (data.submission_type === "report") {
      // For reports, store entity info and changes in details as JSON
      submissionData.entity_type = data.entity_type || null;
      submissionData.entity_id = data.entity_id || null;
      
      // Store changes as JSON string in details field
      // (We could also create a separate changes column, but details works for now)
      if (data.changes && Object.keys(data.changes).length > 0) {
        const changesText = Object.entries(data.changes)
          .map(([field, { current, suggested }]) => 
            `${field}: "${current}" → "${suggested}"`
          )
          .join("\n");
        submissionData.details = data.details 
          ? `${data.details}\n\nChanges:\n${changesText}`
          : `Changes:\n${changesText}`;
      }
    } else if (data.submission_type === "new_artist") {
      // For new artist submissions
      submissionData.artist_name = data.artist_name || null;
      submissionData.artist_instagram_handle = data.artist_instagram_handle || null;
      submissionData.artist_city = data.artist_city || null;
      submissionData.artist_state = data.artist_state || null;
      submissionData.artist_country = data.artist_country || null;
      submissionData.artist_shop_name = data.artist_shop_name || null;
      submissionData.artist_shop_instagram_handle = data.artist_shop_instagram_handle || null;
    }

    // Insert into submissions table
    const { data: insertedSubmission, error: insertError } = await supabase
      .from("submissions")
      .insert(submissionData)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase error inserting submission:", insertError);
      res.status(500).json({
        error: "Failed to submit report",
        details: insertError.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      id: insertedSubmission.id,
      message: "Submission received successfully",
    });
  } catch (error) {
    console.error("Unexpected error in /api/submitReport:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
    });
  }
}
