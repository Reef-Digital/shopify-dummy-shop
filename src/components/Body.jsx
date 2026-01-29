import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INOPS_CONFIG } from "../config/api";
import { createInopsClient } from "@inops/web-sdk";
import ProductModal from "./ProductModal";
import bgImage from "../assets/images/background.png";

export default function Body() {
  const homepageUrl = INOPS_CONFIG.homepageUrl;
  const shopName = INOPS_CONFIG.shopName;
  const campaignId = INOPS_CONFIG.campaignId;
  const hasKey = Boolean(INOPS_CONFIG.searchKey);

  const inopsClient = useMemo(() => {
    if (!hasKey) return null;
    return createInopsClient({
      searchKey: INOPS_CONFIG.searchKey,
      apiUrl: INOPS_CONFIG.apiBaseUrl,
      language: "en",
    });
  }, [hasKey]);

  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [campaignProducts, setCampaignProducts] = useState([]);

  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchSummary, setSearchSummary] = useState("");
  const [searchProducts, setSearchProducts] = useState([]);
  const searchUnsubscribeRef = useRef(null);
  const isSearchingRef = useRef(false);
  const searchProductIdsRef = useRef(new Set());
  const searchFormRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");
  const [similarProducts, setSimilarProducts] = useState([]);
  const similarUnsubscribeRef = useRef(null);

  const debounceId = useRef(null);

  const wordCount = useMemo(() => String(query || "").trim().split(/\s+/).filter(Boolean).length, [query]);

  const title = (p) => String(p?.title || p?.name || p?.productId || p?.id || "").trim() || "Product";
  const brand = (p) => String(p?.brand || p?.vendor || "").trim();
  const img = (p) => {
    const raw =
      p?.image ||
      p?.imageUrl ||
      p?.metadata?.imageUrl ||
      (p?.metadata && typeof p.metadata === 'object' ? p.metadata.imageUrl : null) ||
      (Array.isArray(p?.imagePaths) ? p.imagePaths[0] : null) ||
      (Array.isArray(p?.images) ? p.images[0] : null) ||
      null;
    const imgUrl = raw ? String(raw).trim() : "";
    if (imgUrl) {
      console.log('[Body] Product image found:', { 
        productId: p?.productId || p?.id, 
        title: p?.title || p?.name,
        imgUrl,
        source: p?.image ? 'image' : p?.imageUrl ? 'imageUrl' : p?.metadata?.imageUrl ? 'metadata.imageUrl' : 'other'
      });
    }
    return imgUrl;
  };
  const score = (p) => {
    const s = p?.score ?? p?.relevance ?? null;
    if (typeof s === 'number') {
      // Convert to percentage (0-1 range to 0-100)
      const percent = s * 100;
      return percent.toFixed(0) + '%';
    }
    if (typeof s === 'string') {
      const n = parseFloat(s);
      if (Number.isFinite(n)) {
        // If already > 1, assume it's already a percentage, otherwise convert
        const percent = n > 1 ? n : n * 100;
        return percent.toFixed(0) + '%';
      }
    }
    return '';
  };

  const loadCampaign = useCallback(async () => {
    if (!hasKey || !inopsClient) {
      setCampaignError("Missing VITE_INOPS_SEARCH_KEY");
      console.warn("[Body] Missing searchKey:", { hasKey, searchKey: INOPS_CONFIG.searchKey });
      return;
    }
    if (!campaignId) {
      setCampaignError("Missing VITE_INOPS_CAMPAIGN_ID");
      console.warn("[Body] Missing campaignId:", { campaignId });
      return;
    }
    setCampaignLoading(true);
    setCampaignError("");
    try {
      console.log("[Body] Loading campaign:", { 
        campaignId, 
        searchKey: INOPS_CONFIG.searchKey, 
        searchKeyLength: INOPS_CONFIG.searchKey?.length || 0,
        apiUrl: INOPS_CONFIG.apiBaseUrl 
      });
      const res = await inopsClient.runCampaignAndCollect(campaignId, { timeoutMs: 20_000 });
      console.log("[Body] Campaign response:", {
        sessionId: res?.sessionId,
        summary: res?.summary || '',
        summaryLength: res?.summary?.length || 0,
        productsCount: res?.products?.length || 0,
        products: res?.products?.map(p => ({
          productId: p?.productId || p?.id,
          title: p?.title || p?.name,
          hasImage: Boolean(img(p)),
        })) || [],
        raw: res?.raw,
      });
      
      const products = Array.isArray(res?.products) ? res.products : [];
      console.log("[Body] Campaign products:", {
        count: products.length,
        firstProduct: products[0] ? {
          productId: products[0]?.productId || products[0]?.id,
          title: products[0]?.title || products[0]?.name,
          image: products[0]?.image,
          imageUrl: products[0]?.imageUrl,
          metadata: products[0]?.metadata,
          score: products[0]?.score,
          allKeys: Object.keys(products[0] || {}),
        } : null,
      });
      setCampaignProducts(products);
      
      if (!products.length) {
        const summaryText = res?.summary || "";
        const isExpiredOrEmpty = summaryText.includes("No relevant results") || summaryText.includes("expired");
        const errorMsg = isExpiredOrEmpty 
          ? `Campaign issue: ${summaryText || "Campaign may be expired or have an empty searchTerm"}`
          : `Campaign loaded but no products found. Summary: "${summaryText.substring(0, 100)}"`;
        setCampaignError(errorMsg);
        console.warn("[Body] Campaign validation failed:", {
          summary: summaryText,
        });
      }
    } catch (e) {
      console.error("[Body] Campaign error:", e);
      setCampaignError(String(e?.message || "Failed to load campaign"));
      setCampaignProducts([]);
    } finally {
      setCampaignLoading(false);
    }
  }, [campaignId, hasKey, inopsClient]);

  const searchTimeoutRef = useRef(null);

  const runSearchNow = useCallback(async (val) => {
    const q = String(val ?? query).trim();
    if (!hasKey || !inopsClient) {
      setSearchError("Missing VITE_INOPS_SEARCH_KEY");
      return;
    }
    if (q.split(/\s+/).filter(Boolean).length < 3) {
      setSearchError("Please type at least 3 words to search");
      return;
    }
    
    // Prevent re-triggering if already loading
    if (isSearchingRef.current) {
      console.log("[Body] Search already in progress, skipping");
      return;
    }
    
    // Clean up previous subscription and timeout
    if (searchUnsubscribeRef.current) {
      searchUnsubscribeRef.current();
      searchUnsubscribeRef.current = null;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    isSearchingRef.current = true;
    searchProductIdsRef.current.clear(); // Reset product IDs for new search
    setSearchLoading(true);
    setSearchError("");
    setSearchSummary("");
    setSearchProducts([]); // Reset products - new search

    try {
      console.log("[Body] Running search:", q);
      const { sessionId } = await inopsClient.search(q);
      if (!sessionId) {
        throw new Error("No sessionId returned from search");
      }

      let isActive = true;

      // Subscribe to SSE events
      searchUnsubscribeRef.current = inopsClient.subscribeToSessionSse(sessionId, (evt) => {
        if (!isActive) return;
        
        const ev = String(evt?.event || evt?.data?.event || '').trim();
        const status = String(evt?.status || evt?.data?.status || '').trim();
        
        // Handle error events
        if (ev === 'flow-error' || ev === 'flows-error') {
          const errorMsg =
            String(
              evt?.message ||
              evt?.data?.message ||
              evt?.error ||
              evt?.data?.error ||
              'Search failed'
            ).trim();
          isActive = false;
          isSearchingRef.current = false;
          setSearchError(errorMsg || 'Search failed');
          setSearchLoading(false);
          if (searchUnsubscribeRef.current) {
            searchUnsubscribeRef.current();
            searchUnsubscribeRef.current = null;
          }
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
          return;
        }
        
        const widgets = (evt?.response?.widgets || evt?.data?.response?.widgets || []);
        
        // Extract summary
        const textW = widgets.find((w) => w && (w.type === 'text' || w.kind === 'text'));
        if (textW && (textW.text || textW.value)) {
          setSearchSummary(String(textW.text || textW.value || ''));
        }
        
        // Extract products - accumulate and deduplicate by productId
        const prods = widgets.filter((w) => w && w.type === 'product');
        if (prods.length) {
          setSearchProducts((prev) => {
            const updated = [...prev];
            for (const p of prods) {
              const pid = String(p?.productId || p?.id || '').trim();
              if (pid && !searchProductIdsRef.current.has(pid)) {
                searchProductIdsRef.current.add(pid);
                updated.push(p);
              }
            }
            return updated;
          });
        }

        // Check for flow-end (also check status for done)
        const isEnd =
          status === 'done' ||
          ev === 'end' ||
          ev === 'flow-end' ||
          ev === 'flow-error' ||
          ev === 'flows-error';
          
        if (isEnd) {
          isActive = false;
          isSearchingRef.current = false;
          setSearchLoading(false);
          if (searchUnsubscribeRef.current) {
            searchUnsubscribeRef.current();
            searchUnsubscribeRef.current = null;
          }
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
        }
      });

      // Timeout fallback
      searchTimeoutRef.current = setTimeout(() => {
        if (isActive) {
          isActive = false;
          isSearchingRef.current = false;
          setSearchLoading(false);
          if (searchUnsubscribeRef.current) {
            searchUnsubscribeRef.current();
            searchUnsubscribeRef.current = null;
          }
        }
        searchTimeoutRef.current = null;
      }, 25_000);
    } catch (e) {
      console.error("[Body] Search error:", e);
      isSearchingRef.current = false;
      setSearchError(String(e?.message || "Search failed"));
      setSearchSummary("");
      setSearchProducts([]);
      setSearchLoading(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    }
  }, [hasKey, inopsClient, query]);

  const openProduct = useCallback(async (p) => {
    const pid = String(p?.productId || p?.id || "").trim();
    if (!pid) return;
    setSelectedProduct(p);
    setModalOpen(true);
    if (!hasKey || !inopsClient) return;

    // Clean up previous subscription
    if (similarUnsubscribeRef.current) {
      similarUnsubscribeRef.current();
      similarUnsubscribeRef.current = null;
    }

    setSimilarLoading(true);
    setSimilarError("");
    setSimilarProducts([]);

    try {
      // Use fetch directly since SDK doesn't expose similar_products helper
      const url = `${INOPS_CONFIG.apiBaseUrl}/shop/flow/execute?searchKey=${encodeURIComponent(INOPS_CONFIG.searchKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Search-Key': INOPS_CONFIG.searchKey,
          Authorization: `SearchKey ${INOPS_CONFIG.searchKey}`,
        },
        body: JSON.stringify({
          language: 'en',
          userInput: { type: 'similar_products', productId: pid },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const sessionId = String(json?.sessionId || '').trim();
      if (!sessionId) throw new Error("No sessionId returned");

      // Subscribe to SSE events using SDK
      similarUnsubscribeRef.current = inopsClient.subscribeToSessionSse(sessionId, (evt) => {
        const widgets = (evt?.response?.widgets || evt?.data?.response?.widgets || []);
        const prods = widgets.filter((w) => w && w.type === 'product');
        if (prods.length) {
          setSimilarProducts(prods);
        }

        const ev = String(evt?.event || evt?.data?.event || '').trim();
        if (ev === 'flow-end' || ev === 'end') {
          setSimilarLoading(false);
          if (similarUnsubscribeRef.current) {
            similarUnsubscribeRef.current();
            similarUnsubscribeRef.current = null;
          }
        }
      });

      // Timeout fallback
      setTimeout(() => {
        setSimilarLoading(false);
        if (similarUnsubscribeRef.current) {
          similarUnsubscribeRef.current();
          similarUnsubscribeRef.current = null;
        }
      }, 25_000);
    } catch (e) {
      setSimilarError(String(e?.message || "Failed to load similar products"));
      setSimilarProducts([]);
      setSimilarLoading(false);
    }
  }, [hasKey, inopsClient]);

  function closeModal() {
    setModalOpen(false);
  }

  useEffect(() => {
    // Log configuration on mount
    console.log("[Body] Configuration:", {
      searchKey: INOPS_CONFIG.searchKey || 'MISSING',
      searchKeyLength: INOPS_CONFIG.searchKey?.length || 0,
      campaignId: INOPS_CONFIG.campaignId || 'MISSING',
      apiBaseUrl: INOPS_CONFIG.apiBaseUrl,
      hasKey: Boolean(INOPS_CONFIG.searchKey),
    });
    void loadCampaign();
  }, [loadCampaign]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (searchUnsubscribeRef.current) {
        searchUnsubscribeRef.current();
        searchUnsubscribeRef.current = null;
      }
      if (similarUnsubscribeRef.current) {
        similarUnsubscribeRef.current();
        similarUnsubscribeRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      if (debounceId.current) {
        clearTimeout(debounceId.current);
        debounceId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (debounceId.current) clearTimeout(debounceId.current);
    if (!hasKey || isSearchingRef.current) return; // Don't trigger if already loading
    if (wordCount < 3) {
      setSearchSummary("");
      setSearchProducts([]);
      setSearchError("");
      return;
    }
    debounceId.current = setTimeout(() => {
      void runSearchNow(query);
    }, 550);
    return () => {
      if (debounceId.current) clearTimeout(debounceId.current);
    };
  }, [query, wordCount, hasKey, runSearchNow]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {/* Hero Section with Background */}
      <div
        className="h-[700px] bg-cover bg-center pt-24 relative"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)`,
          }}
        ></div>
        <div className="relative px-20 z-10">
          <div className="flex flex-col items-center">
            <h1 className="text-6xl font-extrabold text-[#1D4C73] mt-6 text-center">
              {shopName}
            </h1>
            <p className="text-xl font-normal my-6 text-[#1B5A8E] text-center">
              Try our AI powered search — faster, smarter, and spot-on every time!
            </p>
            <a 
              href={homepageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 px-8 py-4 bg-[#1B5A8E] text-white text-lg font-semibold rounded-lg hover:bg-[#1D4C73] transition shadow-lg"
            >
              Powered by Inops →
            </a>
          </div>
        </div>
      </div>

      {/* Campaign Products - One Line */}
      <div className="w-full bg-white py-8 -mt-[260px] relative z-20">
        <div className="max-w-[1080px] mx-auto px-20">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-[#0F3253]">Stored campaign products</h2>
          </div>
          {campaignError ? (
            <div className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <strong>Campaign Error:</strong> {campaignError}
              {!hasKey && <div className="mt-1">Missing <code className="bg-red-100 px-1 rounded">VITE_INOPS_SEARCH_KEY</code></div>}
              {!campaignId && <div className="mt-1">Missing <code className="bg-red-100 px-1 rounded">VITE_INOPS_CAMPAIGN_ID</code></div>}
            </div>
          ) : null}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {campaignLoading ? (
              <div className="text-sm text-gray-500 py-4">Loading campaign products...</div>
            ) : campaignProducts.length > 0 ? (
              campaignProducts.map((p) => (
                <button
                  key={String(p?.productId || p?.id || p?.title || "")}
                  type="button"
                  className="flex-shrink-0 w-48 rounded-lg border border-[#A9CEE9] bg-white p-4 hover:bg-gray-50 transition text-left overflow-hidden"
                  onClick={() => openProduct(p)}
                >
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden rounded mb-3" style={{ maxHeight: '96px' }}>
                    {img(p) ? <img src={img(p)} alt={title(p)} className="w-full h-full object-cover" /> : (
                      <div className="text-xs text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="font-semibold text-sm text-[#0F3253] truncate">
                    {title(p)}
                    {score(p) ? <span className="text-gray-500 ml-1">({score(p)})</span> : null}
                  </div>
                </button>
              ))
            ) : !campaignLoading && hasKey && campaignId ? (
              <div className="text-sm text-gray-500 py-4">No campaign products found. Check if campaign is active and has products.</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Search Bar - Full Width */}
      <div className="w-full bg-white py-10 border-t border-gray-200">
        <div className="max-w-[1080px] mx-auto px-20">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-[#0F3253] mb-2">Search Products</h2>
            <p className="text-sm text-gray-600">Type 3 or more words to search automatically</p>
          </div>
          <div className="relative" ref={searchFormRef}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (wordCount >= 3) {
                  void runSearchNow(query);
                }
              }}
              className="flex gap-3"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. kid longboard beginner"
                  className="w-full h-14 rounded-lg border-2 border-[#6BD7FF] bg-white px-5 text-lg outline-none focus:ring-2 focus:ring-[#6BD7FF] shadow-lg"
                />
                {/* Collapsible Results Dropdown - matches search field width */}
                {wordCount >= 3 && (searchSummary || searchProducts.length > 0 || searchLoading) ? (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-white shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                    {/* Products list - vertical, scrollable */}
                    <div className="overflow-auto divide-y max-h-72">
                      {searchLoading ? (
                        <div className="p-3 text-xs text-gray-500">Streaming results…</div>
                      ) : searchProducts.length > 0 ? (
                        searchProducts.map((p, idx) => (
                          <button
                            key={String(p?.productId || p?.id || p?.title || idx)}
                            type="button"
                            className="w-full text-left p-3 hover:bg-gray-50 transition flex items-center gap-3"
                            onClick={() => openProduct(p)}
                          >
                            {/* Image first */}
                            <div className="flex-shrink-0 w-12 h-12 rounded border bg-gray-50 overflow-hidden">
                              {img(p) ? (
                                <img src={img(p)} alt={title(p)} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No img</div>
                              )}
                            </div>
                            {/* Title and score */}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {title(p)}
                                {score(p) ? (
                                  <span className="text-gray-500 ml-1">({score(p)})</span>
                                ) : null}
                              </div>
                              {brand(p) ? (
                                <div className="text-xs text-gray-500 truncate">Brand: {brand(p)}</div>
                              ) : null}
                            </div>
                          </button>
                        ))
                      ) : !searchLoading ? (
                        <div className="p-3 text-sm text-gray-500 text-center">No results found.</div>
                      ) : null}
                    </div>
                    
                    {/* Summary at the bottom */}
                    {searchSummary ? (
                      <div className="border-t bg-blue-50 text-sm p-3 flex-shrink-0">
                        {searchSummary}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <button
                type="submit"
                className="h-14 px-8 rounded-lg bg-[#1B5A8E] text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1D4C73] transition shadow-lg"
                disabled={!hasKey || searchLoading || wordCount < 3}
              >
                {searchLoading ? "Searching…" : "Search"}
              </button>
            </form>
            {searchError ? <div className="mt-3 text-sm text-red-600">{searchError}</div> : null}
            {!hasKey ? (
              <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Demo is not configured: missing <span className="font-mono">VITE_INOPS_SEARCH_KEY</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        homepageUrl={homepageUrl}
        product={selectedProduct}
        similar={similarProducts}
        loading={similarLoading}
        error={similarError}
        onClose={closeModal}
        onSelectSimilar={openProduct}
      />
    </div>
  );
}
