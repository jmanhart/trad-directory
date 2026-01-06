import { createClient } from "@supabase/supabase-js";

interface LinkStatus {
  url: string;
  handle: string;
  type: "artist" | "shop";
  id: number;
  name: string;
  status: number | null;
  error: string | null;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== "GET") {
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

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Fetch artist Instagram handles
    const { data: artistData, error: artistError } = await supabase
      .from("artists")
      .select("id, name, instagram_handle")
      .not("instagram_handle", "is", null);

    if (artistError) {
      console.error("Error fetching artist Instagram links:", artistError);
      res.status(500).json({ error: "Failed to fetch artist links" });
      return;
    }

    // Fetch shop Instagram handles
    const { data: shopData, error: shopError } = await supabase
      .from("tattoo_shops")
      .select("id, shop_name, instagram_handle")
      .not("instagram_handle", "is", null);

    if (shopError) {
      console.error("Error fetching shop Instagram links:", shopError);
      res.status(500).json({ error: "Failed to fetch shop links" });
      return;
    }

    // Combine all links
    const allLinks: LinkStatus[] = [];

    // Add artist links
    for (const artist of artistData || []) {
      const url = `https://www.instagram.com/${artist.instagram_handle}`;
      allLinks.push({
        url,
        handle: artist.instagram_handle,
        type: "artist",
        id: artist.id,
        name: artist.name,
        status: null,
        error: null,
      });
    }

    // Add shop links
    for (const shop of shopData || []) {
      const url = `https://www.instagram.com/${shop.instagram_handle}`;
      allLinks.push({
        url,
        handle: shop.instagram_handle,
        type: "shop",
        id: shop.id,
        name: shop.shop_name,
        status: null,
        error: null,
      });
    }

    // Check each link with delay
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const brokenLinks: LinkStatus[] = [];

    for (const link of allLinks) {
      try {
        // Add delay to avoid rate limiting (2-3 seconds)
        await delay(2000 + Math.random() * 1000);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(link.url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LinkChecker/1.0)",
          },
        });

        clearTimeout(timeoutId);

        // Only include if status is NOT 200
        if (response.status !== 200) {
          link.status = response.status;
          brokenLinks.push(link);
        }
      } catch (error: any) {
        // Link is broken or unreachable
        link.error = error.message || "Unreachable";
        link.status = null;
        brokenLinks.push(link);
      }
    }

    res.status(200).json({
      brokenLinks,
      totalChecked: allLinks.length,
      brokenCount: brokenLinks.length,
    });
  } catch (error: any) {
    console.error("Error checking Instagram links:", error);
    res.status(500).json({
      error: "Failed to check links",
      details: error.message,
    });
  }
}

