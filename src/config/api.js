// Inops dummy shop configuration (Vite env)
export const INOPS_CONFIG = {
  apiBaseUrl: String(import.meta.env.VITE_INOPS_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, ''),
  searchKey: String(import.meta.env.VITE_INOPS_SEARCH_KEY || '').trim(),
  campaignId: String(import.meta.env.VITE_INOPS_CAMPAIGN_ID || '').trim(),
  homepageUrl: String(import.meta.env.VITE_INOPS_HOMEPAGE_URL || 'https://www.inops.io').trim(),
  shopName: String(import.meta.env.VITE_DUMMY_SHOP_NAME || 'Longboard Dummy Shop').trim(),
}

export function requireSearchKey() {
  if (!INOPS_CONFIG.searchKey) {
    throw new Error('Missing VITE_INOPS_SEARCH_KEY (see env.example)')
  }
  return INOPS_CONFIG.searchKey
}

export function getSearchApiUrl() {
  return INOPS_CONFIG.apiBaseUrl
}
