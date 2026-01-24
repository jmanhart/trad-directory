// Type definitions for analytics events
export type AnalyticsEvent = 
  | { name: 'page_view'; params: PageViewParams }
  | { name: 'search'; params: SearchParams }
  | { name: 'click_recently_added'; params: RecentlyAddedClickParams }
  | { name: 'click_hero_message'; params: HeroMessageClickParams }
  | { name: 'click_artist_card'; params: ArtistCardClickParams }
  | { name: 'click_shop_card'; params: ShopCardClickParams };

export interface PageViewParams {
  page_title?: string;
  page_location?: string;
  page_path?: string;
}

export interface SearchParams {
  search_term: string;
  search_location?: 'home' | 'header' | 'search_results' | 'all_artists' | 'all_shops';
  results_count?: number;
  has_results?: boolean;
}

export interface RecentlyAddedClickParams {
  item_type: 'artist' | 'shop' | 'country';
  item_id?: number;
  item_name?: string;
  item_instagram_handle?: string;
}

export interface HeroMessageClickParams {
  link_type: 'artists' | 'shops';
  metric_value?: number;
}

export interface ArtistCardClickParams {
  artist_id: number;
  artist_name: string;
  artist_instagram_handle?: string;
  source?: string;
}

export interface ShopCardClickParams {
  shop_id: number;
  shop_name: string;
  shop_instagram_handle?: string;
  source?: string;
}

// Declare gtag function on window
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date | Record<string, any>,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

/**
 * Check if Google Analytics is loaded
 */
function isGALoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Track a page view
 */
export function trackPageView(params: PageViewParams = {}): void {
  if (!isGALoaded()) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Google Analytics not loaded');
    }
    return;
  }

  const pagePath = params.page_path || window.location.pathname;
  const pageTitle = params.page_title || document.title;
  const pageLocation = params.page_location || window.location.href;

  window.gtag('config', 'G-2NC691XV7J', {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: pageLocation,
  });

  // Also send as event for more detailed tracking
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: pageLocation,
    event_category: 'Navigation',
    event_label: pagePath,
  });
}

/**
 * Track a search query
 */
export function trackSearch(params: SearchParams): void {
  if (!isGALoaded()) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Google Analytics not loaded');
    }
    return;
  }

  window.gtag('event', 'search', {
    search_term: params.search_term,
    search_location: params.search_location || 'unknown',
    results_count: params.results_count,
    has_results: params.has_results,
    event_category: 'Search',
    event_label: params.search_term,
    value: params.results_count || 0,
  });
}

/**
 * Track clicks from Recently Added section
 */
export function trackRecentlyAddedClick(params: RecentlyAddedClickParams): void {
  if (!isGALoaded()) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Google Analytics not loaded');
    }
    return;
  }

  window.gtag('event', 'click_recently_added', {
    item_type: params.item_type,
    item_id: params.item_id,
    item_name: params.item_name,
    item_instagram_handle: params.item_instagram_handle,
    event_category: 'Recently Added',
    event_label: `${params.item_type}: ${params.item_name || params.item_id}`,
  });
}

/**
 * Track clicks on Hero Message links
 */
export function trackHeroMessageClick(params: HeroMessageClickParams): void {
  if (!isGALoaded()) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Google Analytics not loaded');
    }
    return;
  }

  window.gtag('event', 'click_hero_message', {
    link_type: params.link_type,
    metric_value: params.metric_value,
    event_category: 'Hero Message',
    event_label: params.link_type,
  });
}

/**
 * Track artist card clicks
 */
export function trackArtistCardClick(params: ArtistCardClickParams): void {
  if (!isGALoaded()) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Google Analytics not loaded');
    }
    return;
  }

  window.gtag('event', 'click_artist_card', {
    artist_id: params.artist_id,
    artist_name: params.artist_name,
    artist_instagram_handle: params.artist_instagram_handle,
    source: params.source,
    event_category: 'Artist Card',
    event_label: params.artist_name,
  });
}

/**
 * Track shop card clicks
 */
export function trackShopCardClick(params: ShopCardClickParams): void {
  if (!isGALoaded()) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Google Analytics not loaded');
    }
    return;
  }

  window.gtag('event', 'click_shop_card', {
    shop_id: params.shop_id,
    shop_name: params.shop_name,
    shop_instagram_handle: params.shop_instagram_handle,
    source: params.source,
    event_category: 'Shop Card',
    event_label: params.shop_name,
  });
}
