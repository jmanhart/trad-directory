/**
 * Shared API and helpers for report-issue and suggest-artist submissions.
 */

export function normalizeInstagramHandle(input: string): string {
  if (!input) return "";
  return input
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/^@/, "")
    .trim();
}

export interface NewArtistSubmission {
  submission_type: "new_artist";
  artist_name: string;
  artist_instagram_handle: string;
  artist_city: string;
  artist_country: string;
  details: string | null;
  reporter_email: string | null;
  page_url: string;
}

export interface ReportSubmission {
  submission_type: "report";
  entity_type: "artist" | "shop";
  entity_id: string;
  changes: Record<string, { current: string; suggested: string }>;
  details: string | null;
  reporter_email: string | null;
  page_url: string;
}

const getApiUrl = () => import.meta.env.VITE_API_URL || "/api/submitReport";

export async function submitReport(payload: ReportSubmission): Promise<void> {
  const response = await fetch(getApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.details ||
        errorData.error ||
        `HTTP error! status: ${response.status}`
    );
  }
}

export async function submitNewArtistSuggestion(
  payload: NewArtistSubmission
): Promise<void> {
  const response = await fetch(getApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.details ||
        errorData.error ||
        `HTTP error! status: ${response.status}`
    );
  }
}
