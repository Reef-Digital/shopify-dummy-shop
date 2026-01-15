<<<<<<< Updated upstream
// API Configuration
export const API_CONFIG = {
  // Use environment variable or fallback to default
  SEARCH_URL:
    import.meta.env.VITE_API_URL || "https://plugin.sandbox.inops.io/ai/search",
};

// Helper function to get API URL
export const getSearchApiUrl = () => {
  return API_CONFIG.SEARCH_URL;
};
=======
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
>>>>>>> Stashed changes
