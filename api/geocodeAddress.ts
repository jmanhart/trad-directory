import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdminAuth } from "./_middleware/auth";
import { geocodeAddress } from "./_utils/geocode";

// Admin-only address geocoding preview. Powers the "Check address" tool in the
// shop add/edit forms so an admin can confirm where an address will land before
// saving. Returns { lat, lng }, or { lat: null, lng: null } when unresolved.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAdminAuth(req, res)) return;

  try {
    const body = (req.body ?? {}) as {
      address?: unknown;
      city_name?: unknown;
      state_name?: unknown;
      country_name?: unknown;
    };
    const address =
      typeof body.address === "string" ? body.address.trim() : "";
    if (!address) {
      res.status(400).json({ error: "address is required" });
      return;
    }
    const str = (v: unknown) => (typeof v === "string" ? v : null);
    const coords = await geocodeAddress(
      address,
      str(body.city_name),
      str(body.state_name),
      str(body.country_name)
    );
    res.status(200).json({ lat: coords?.lat ?? null, lng: coords?.lng ?? null });
  } catch (error) {
    console.error("Error geocoding address:", error);
    res.status(500).json({ error: "Failed to geocode address" });
  }
}
