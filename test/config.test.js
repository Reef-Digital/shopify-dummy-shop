import { describe, it, expect, beforeEach, vi } from "vitest";

describe("API config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports INOPS_CONFIG with expected keys", async () => {
    const { INOPS_CONFIG } = await import("../src/config/api.js");
    expect(INOPS_CONFIG).toHaveProperty("apiBaseUrl");
    expect(INOPS_CONFIG).toHaveProperty("searchKey");
    expect(INOPS_CONFIG).toHaveProperty("campaignId");
    expect(INOPS_CONFIG).toHaveProperty("homepageUrl");
    expect(INOPS_CONFIG).toHaveProperty("shopName");
  });

  it("strips trailing slash from apiBaseUrl", async () => {
    const { INOPS_CONFIG } = await import("../src/config/api.js");
    expect(INOPS_CONFIG.apiBaseUrl).not.toMatch(/\/$/);
  });

  it("exports requireSearchKey that throws when key is empty", async () => {
    const { requireSearchKey, INOPS_CONFIG } = await import("../src/config/api.js");
    // In test env, VITE_INOPS_SEARCH_KEY is not set
    if (!INOPS_CONFIG.searchKey) {
      expect(() => requireSearchKey()).toThrow("Missing VITE_INOPS_SEARCH_KEY");
    }
  });

  it("exports getSearchApiUrl function", async () => {
    const { getSearchApiUrl } = await import("../src/config/api.js");
    expect(typeof getSearchApiUrl).toBe("function");
    const url = getSearchApiUrl();
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(0);
  });

  it("homepageUrl defaults to inops.io", async () => {
    const { INOPS_CONFIG } = await import("../src/config/api.js");
    expect(INOPS_CONFIG.homepageUrl).toContain("inops.io");
  });

  it("shopName has a default value", async () => {
    const { INOPS_CONFIG } = await import("../src/config/api.js");
    expect(INOPS_CONFIG.shopName.length).toBeGreaterThan(0);
  });
});
