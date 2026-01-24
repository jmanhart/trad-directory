import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

/**
 * Hook to automatically track page views on route changes
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      trackPageView({
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [location]);
}
