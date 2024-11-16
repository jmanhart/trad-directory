// Import 'dotenv' to load environment variables from a .env file
import "dotenv/config";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and ANON key must be provided.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to fetch Instagram links from the 'artists' and 'tattoo_shops' tables
const fetchInstagramLinks = async () => {
  try {
    // Fetch artist Instagram handles
    const { data: artistData, error: artistError } = await supabase
      .from("artists")
      .select("instagram_handle");

    if (artistError) {
      console.error(
        "Error fetching artist Instagram links:",
        artistError.message
      );
    }

    // Fetch tattoo shop Instagram handles
    const { data: shopData, error: shopError } = await supabase
      .from("tattoo_shops")
      .select("instagram_handle");

    if (shopError) {
      console.error(
        "Error fetching tattoo shop Instagram links:",
        shopError.message
      );
    }

    // Combine and filter data
    const artistLinks = (artistData || [])
      .filter((artist) => artist.instagram_handle)
      .map((artist) => `https://www.instagram.com/${artist.instagram_handle}`);

    const shopLinks = (shopData || [])
      .filter((shop) => shop.instagram_handle)
      .map((shop) => `https://www.instagram.com/${shop.instagram_handle}`);

    return [...artistLinks, ...shopLinks];
  } catch (err) {
    console.error("Unhandled error during data fetching:", err);
    return [];
  }
};

// Function to add a delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to check the status of each Instagram link with a delay between requests
const checkLinks = async () => {
  const links = await fetchInstagramLinks();
  if (links.length === 0) {
    console.log(
      "No Instagram links found or there was an error fetching them."
    );
    return;
  }

  for (const link of links) {
    try {
      await delay(2000 + Math.random() * 1000); // 2 to 3 second delay between requests
      const response = await axios.get(link);
      if (response.status >= 200 && response.status < 400) {
        console.log(`${link} is working (status: ${response.status})`);
      } else {
        console.log(`${link} might be broken (status: ${response.status})`);
      }
    } catch (error) {
      console.log(`${link} is broken or unreachable.`);
    }
  }
};

// Run the link check
checkLinks();
