import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Checks for a valid admin API key in the Authorization header.
 * Returns true if authenticated, false if not (and sends 401 response).
 *
 * Usage:
 *   if (!requireAdminAuth(req, res)) return;
 */
export function requireAdminAuth(
  req: VercelRequest,
  res: VercelResponse
): boolean {
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminApiKey) {
    console.error("ADMIN_API_KEY env var not set");
    res.status(500).json({ error: "Server configuration error" });
    return false;
  }

  const authHeader = req.headers["authorization"];

  if (!authHeader || authHeader !== `Bearer ${adminApiKey}`) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}
