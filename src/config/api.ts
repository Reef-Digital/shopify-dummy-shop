// API Configuration
export const API_CONFIG = {
  // Use environment variable or fallback to default
  SEARCH_URL:
    import.meta.env.VITE_API_URL ||
    "https://parker-undertake-pharmacology-year.trycloudflare.com/ai/search",
};

// Helper function to get API URL
export const getSearchApiUrl = () => {
  return API_CONFIG.SEARCH_URL;
};
