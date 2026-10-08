import { useEffect } from 'react';
import { useSettings } from '@/store/settings';

const FALLBACK_DESCRIPTION = 'NOORÉ — hand-poured fragrance candles and gifting for every occasion. Essentials, Premium and Luxury collections.';

export function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · NOORÉ` : 'NOORÉ · Made to make moments.';
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) { tag = document.createElement('meta'); tag.name = 'description'; document.head.appendChild(tag); }
    // Pages without their own description fall back to the site's (otherwise the last product's
    // tagline lingered after client-side navigation).
    tag.content = description || useSettings.getState().settings?.seo?.description || FALLBACK_DESCRIPTION;
  }, [title, description]);
}
