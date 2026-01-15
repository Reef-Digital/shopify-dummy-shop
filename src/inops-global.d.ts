// Type declaration for Inops Web SDK loaded from CDN
declare global {
  interface Window {
    Inops?: {
      createInopsClient: (config: {
        searchKey: string;
        apiUrl: string;
        language?: string;
      }) => any;
      readCampaignIdFromUrl?: (param: string) => string | null;
      runCampaignAndCollect?: (campaignId: string, opts?: { timeoutMs?: number }) => Promise<any>;
      [key: string]: any;
    };
    __INOPS_API_BASE_URL__?: string;
  }
}

export {};
