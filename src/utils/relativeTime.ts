/**
 * Formats a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) {
    return "Unknown";
  }

  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(then.getTime())) {
    return "Unknown";
  }

  const diffInMs = now.getTime() - then.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  } else {
    return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
  }
}

