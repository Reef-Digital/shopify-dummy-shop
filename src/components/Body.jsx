import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INOPS_CONFIG } from "../config/api";
import ProductModal from "./ProductModal";
import bgImage from "../assets/images/background.png";
import inventoryProducts from "../data/products.json";

/* ── helpers ── */
const title = (p) => String(p?.title || p?.name || p?.productId || p?.id || "").trim() || "Product";
const brand = (p) => String(p?.brand || p?.vendor || "").trim();
const category = (p) => String(p?.category || p?.metadata?.category || "").trim();
const description = (p) => String(p?.description || "").trim();
const reason = (p) => String(p?.reason || "").trim();

const img = (p) => {
  const raw =
    p?.image || p?.imageUrl || p?.metadata?.imageUrl ||
    (Array.isArray(p?.imagePaths) ? p.imagePaths[0] : null) ||
    (Array.isArray(p?.images) ? p.images[0] : null) ||
    null;
  return raw ? String(raw).trim() : "";
};

const score = (p) => {
  const s = p?.score ?? p?.relevance ?? null;
  if (typeof s === "number") return (s * 100).toFixed(0) + "%";
  if (typeof s === "string") {
    const n = parseFloat(s);
    if (Number.isFinite(n)) return ((n > 1 ? n : n * 100)).toFixed(0) + "%";
  }
  return "";
};

const price = (p) => {
  const v = p?.price ?? p?.metadata?.price ?? null;
  if (v == null) return "";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "";
};

const placeholderImg = (text, size = 96) =>
  `https://placehold.co/${size}x${size}/E5E7EB/6B7280?text=${encodeURIComponent(text.substring(0, 10))}`;

/* ── fetch helper (POST + x-search-key header) ── */
const executeFlow = async (body) => {
  const res = await fetch(`${INOPS_CONFIG.apiBaseUrl}/shop/flow/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Search-Key": INOPS_CONFIG.searchKey,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(json?.message ?? json?.error ?? `HTTP ${res.status}`));
  const sessionId = String(json?.sessionId ?? "").trim();
  if (!sessionId) throw new Error("No sessionId returned");
  return sessionId;
};

/* ── Component ── */
export default function Body() {
  const homepageUrl = INOPS_CONFIG.homepageUrl;
  const shopName = INOPS_CONFIG.shopName;
  const campaignId = INOPS_CONFIG.campaignId;
  const hasKey = Boolean(INOPS_CONFIG.searchKey);

  // SDK readiness
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState("");

  useEffect(() => {
    if (!hasKey) return;
    if (window.Inops?.createInopsClient) { setSdkReady(true); return; }

    let attempts = 0;
    const id = setInterval(() => {
      attempts++;
      if (window.Inops?.createInopsClient) { setSdkReady(true); clearInterval(id); }
      else if (attempts >= 50) { setSdkError("SDK failed to load from CDN"); clearInterval(id); }
    }, 100);
    return () => clearInterval(id);
  }, [hasKey]);

  const inopsClient = useMemo(() => {
    if (!hasKey || !sdkReady) return null;
    try {
      return window.Inops.createInopsClient({
        searchKey: INOPS_CONFIG.searchKey,
        apiUrl: INOPS_CONFIG.apiBaseUrl,
        language: "en",
      });
    } catch { return null; }
  }, [hasKey, sdkReady]);

  /* ── Campaign ── */
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [campaignProducts, setCampaignProducts] = useState([]);
  const campaignLoadedRef = useRef(false);

  const loadCampaign = useCallback(async () => {
    if (campaignLoadedRef.current) return;
    if (!hasKey || !inopsClient) { setCampaignError("Missing VITE_INOPS_SEARCH_KEY"); return; }
    if (!campaignId) { setCampaignError("Missing VITE_INOPS_CAMPAIGN_ID"); return; }

    campaignLoadedRef.current = true;
    setCampaignLoading(true);
    setCampaignError("");
    try {
      const res = await inopsClient.runCampaignAndCollect(campaignId, { timeoutMs: 20_000 });
      const products = Array.isArray(res?.products) ? res.products : [];
      setCampaignProducts(products);
      if (!products.length) {
        const summary = res?.summary || "";
        setCampaignError(summary.includes("No relevant") || summary.includes("expired")
          ? `Campaign issue: ${summary || "may be expired or empty"}`
          : "Campaign loaded but no products found.");
        campaignLoadedRef.current = false;
      }
    } catch (e) {
      setCampaignError(String(e?.message || "Failed to load campaign"));
      setCampaignProducts([]);
      campaignLoadedRef.current = false;
    } finally {
      setCampaignLoading(false);
    }
  }, [campaignId, hasKey, inopsClient]);

  const retryCampaign = useCallback(() => {
    campaignLoadedRef.current = false;
    setCampaignError("");
    setCampaignProducts([]);
    void loadCampaign();
  }, [loadCampaign]);

  /* ── Search ── */
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchSummary, setSearchSummary] = useState("");
  const [searchProducts, setSearchProducts] = useState([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const searchUnsubRef = useRef(null);
  const isSearchingRef = useRef(false);
  const searchIdsRef = useRef(new Set());
  const searchTimeoutRef = useRef(null);
  const debounceId = useRef(null);

  const charCount = useMemo(() => String(query || "").trim().length, [query]);
  const wordCount = useMemo(() => String(query || "").trim().split(/\s+/).filter(Boolean).length, [query]);

  const cleanupSearch = useCallback(() => {
    if (searchUnsubRef.current) { searchUnsubRef.current(); searchUnsubRef.current = null; }
    if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }
  }, []);

  const runSearchNow = useCallback(async (val) => {
    const q = String(val ?? query).trim();
    if (!hasKey || !inopsClient) { setSearchError("Search not ready (missing key or SDK)."); return; }
    if (q.length < 3) { setSearchError("Please enter at least 3 characters"); return; }
    if (isSearchingRef.current) return;

    cleanupSearch();
    isSearchingRef.current = true;
    searchIdsRef.current.clear();
    setSearchLoading(true);
    setSearchError("");
    setSearchSummary("");
    setSearchProducts([]);
    setSearchCompleted(false);

    try {
      const sessionId = await executeFlow({ language: "en", userInput: { type: "search", value: q } });
      let isActive = true;

      searchUnsubRef.current = inopsClient.subscribeToSessionSse(sessionId, (evt) => {
        if (!isActive) return;

        const ev = String(evt?.event || evt?.data?.event || "").trim();

        if (ev === "flow-error" || ev === "flows-error") {
          const msg = String(evt?.message || evt?.data?.message || evt?.error || "Search failed").trim();
          isActive = false;
          isSearchingRef.current = false;
          setSearchError(msg);
          setSearchLoading(false);
          setSearchCompleted(true);
          cleanupSearch();
          return;
        }

        const widgets = evt?.response?.widgets || evt?.data?.response?.widgets || [];

        const textW = widgets.find((w) => w?.type === "text" || w?.kind === "text");
        if (textW && (textW.text || textW.value)) setSearchSummary(String(textW.text || textW.value));

        const prods = widgets.filter((w) => w?.type === "product");
        if (prods.length) {
          setSearchProducts((prev) => {
            const updated = [...prev];
            for (const p of prods) {
              const pid = String(p?.productId || p?.id || "").trim();
              if (pid && !searchIdsRef.current.has(pid)) {
                searchIdsRef.current.add(pid);
                updated.push(p);
              }
            }
            return updated;
          });
        }

        if (["done", "end", "flow-end"].includes(ev)) {
          isActive = false;
          isSearchingRef.current = false;
          setSearchLoading(false);
          setSearchCompleted(true);
          cleanupSearch();
        }
      });

      searchTimeoutRef.current = setTimeout(() => {
        if (isActive) {
          isActive = false;
          isSearchingRef.current = false;
          setSearchLoading(false);
          setSearchCompleted(true);
          cleanupSearch();
        }
      }, 25_000);
    } catch (e) {
      isSearchingRef.current = false;
      setSearchError(String(e?.message || "Search failed"));
      setSearchLoading(false);
      setSearchCompleted(true);
      cleanupSearch();
    }
  }, [hasKey, inopsClient, query, cleanupSearch]);

  /* ── Similar Products ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");
  const [similarProducts, setSimilarProducts] = useState([]);
  const similarUnsubRef = useRef(null);

  const openProduct = useCallback(async (p) => {
    const pid = String(p?.productId || p?.id || "").trim();
    if (!pid) return;
    setSelectedProduct(p);
    setModalOpen(true);
    if (!hasKey || !inopsClient) return;

    if (similarUnsubRef.current) { similarUnsubRef.current(); similarUnsubRef.current = null; }
    setSimilarLoading(true);
    setSimilarError("");
    setSimilarProducts([]);

    try {
      const sessionId = await executeFlow({ language: "en", userInput: { type: "similar_products", productId: pid } });

      similarUnsubRef.current = inopsClient.subscribeToSessionSse(sessionId, (evt) => {
        const widgets = evt?.response?.widgets || evt?.data?.response?.widgets || [];
        const prods = widgets.filter((w) => w?.type === "product");
        if (prods.length) setSimilarProducts(prods);

        const ev = String(evt?.event || evt?.data?.event || "").trim();
        if (ev === "flow-end" || ev === "end") {
          setSimilarLoading(false);
          if (similarUnsubRef.current) { similarUnsubRef.current(); similarUnsubRef.current = null; }
        }
      });

      setTimeout(() => {
        setSimilarLoading(false);
        if (similarUnsubRef.current) { similarUnsubRef.current(); similarUnsubRef.current = null; }
      }, 25_000);
    } catch (e) {
      setSimilarError(String(e?.message || "Failed to load similar products"));
      setSimilarProducts([]);
      setSimilarLoading(false);
    }
  }, [hasKey, inopsClient]);

  /* ── Effects ── */
  useEffect(() => {
    if (hasKey && sdkReady && inopsClient && campaignId && !campaignLoadedRef.current) {
      void loadCampaign();
    }
  }, [hasKey, sdkReady, inopsClient, campaignId, loadCampaign]);

  useEffect(() => () => {
    cleanupSearch();
    if (similarUnsubRef.current) { similarUnsubRef.current(); similarUnsubRef.current = null; }
    if (debounceId.current) clearTimeout(debounceId.current);
  }, [cleanupSearch]);

  useEffect(() => {
    if (debounceId.current) clearTimeout(debounceId.current);
    if (!hasKey || !inopsClient || isSearchingRef.current) return;
    if (charCount < 3) {
      setSearchSummary("");
      setSearchProducts([]);
      setSearchError("");
      setSearchCompleted(false);
      return;
    }
    debounceId.current = setTimeout(() => void runSearchNow(query), 550);
    return () => { if (debounceId.current) clearTimeout(debounceId.current); };
  }, [query, charCount, hasKey, inopsClient, runSearchNow]);

  /* ── Render ── */
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {/* SDK error banner */}
      {sdkError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-6 py-3 text-center">
          {sdkError}
        </div>
      )}

      {/* Hero */}
      <div
        className="h-[700px] bg-cover bg-center pt-24 relative"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{ background: "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)" }}
        />
        <div className="relative px-6 md:px-20 z-10">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#1D4C73] mt-12 text-center">
              {shopName}
            </h1>
            <p className="text-lg md:text-xl font-normal my-6 text-[#1B5A8E] text-center max-w-2xl">
              Try our AI powered search — faster, smarter, and spot-on every time!
            </p>
            <a
              href={homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-8 py-4 bg-[#1B5A8E] text-white text-lg font-semibold rounded-lg hover:bg-[#1D4C73] transition shadow-lg"
            >
              Powered by Inops
            </a>
          </div>
        </div>
      </div>

      {/* Campaign Products */}
      <div className="w-full bg-white py-8 -mt-[260px] relative z-20">
        <div className="max-w-[1080px] mx-auto px-6 md:px-20">
          <h2 className="text-2xl font-semibold text-[#0F3253] mb-4">Featured Products</h2>

          {campaignError && (
            <div className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex flex-col gap-2">
              <div>
                <strong>Campaign Error:</strong> {campaignError}
                {!hasKey && <div className="mt-1">Missing <code className="bg-red-100 px-1 rounded">VITE_INOPS_SEARCH_KEY</code></div>}
                {!campaignId && <div className="mt-1">Missing <code className="bg-red-100 px-1 rounded">VITE_INOPS_CAMPAIGN_ID</code></div>}
              </div>
              {hasKey && campaignId && (
                <button
                  type="button"
                  onClick={retryCampaign}
                  disabled={campaignLoading}
                  className="self-start px-4 py-2 rounded-lg bg-[#1B5A8E] text-white text-sm font-medium hover:bg-[#1D4C73] disabled:opacity-50"
                >
                  {campaignLoading ? "Loading\u2026" : "Retry campaign"}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {campaignLoading ? (
              <div className="col-span-full text-sm text-gray-500 py-8 text-center">Loading featured products\u2026</div>
            ) : campaignProducts.length > 0 ? (
              campaignProducts.map((p) => (
                <button
                  key={String(p?.productId || p?.id || title(p))}
                  type="button"
                  className="group rounded-xl border border-gray-200 bg-white hover:border-[#6BD7FF] hover:shadow-lg transition-all text-left overflow-hidden"
                  onClick={() => openProduct(p)}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                    {img(p) ? (
                      <img
                        src={img(p)}
                        alt={title(p)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg(title(p), 200); }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">{title(p).substring(0, 20)}</span>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-3">
                    <div className="font-semibold text-sm text-[#0F3253] leading-tight line-clamp-2">
                      {title(p)}
                    </div>
                  </div>
                </button>
              ))
            ) : !campaignLoading && hasKey && campaignId ? (
              <div className="text-sm text-gray-500 py-4">No campaign products found.</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="w-full bg-white py-10 border-t border-gray-200">
        <div className="max-w-[1080px] mx-auto px-6 md:px-20">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-2xl font-semibold text-[#0F3253]">Search Products</h2>
              {charCount >= 3 && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    wordCount === 1 ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {wordCount === 1 ? "Direct" : "Intent"}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">Type 3+ characters to search automatically</p>
          </div>

          <div className="relative">
            <form
              onSubmit={(e) => { e.preventDefault(); if (charCount >= 3) void runSearchNow(query); }}
              className="flex gap-3"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. longboard for beginners"
                  className="w-full h-14 rounded-lg border-2 border-[#6BD7FF] bg-white px-5 text-lg outline-none focus:ring-2 focus:ring-[#6BD7FF] shadow-lg"
                />

                {/* Results dropdown */}
                {charCount >= 3 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-white shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="overflow-auto divide-y max-h-72">
                      {searchLoading ? (
                        <div className="p-3 text-xs text-gray-500">Streaming results\u2026</div>
                      ) : searchError ? (
                        <div className="p-3 text-sm text-red-600">{searchError}</div>
                      ) : searchProducts.length > 0 ? (
                        searchProducts.map((p, idx) => (
                          <button
                            key={String(p?.productId || p?.id || idx)}
                            type="button"
                            className="w-full text-left p-3 hover:bg-gray-50 transition flex items-center gap-3"
                            onClick={() => openProduct(p)}
                          >
                            <div className="flex-shrink-0 w-12 h-12 rounded border bg-gray-50 overflow-hidden">
                              {img(p) ? (
                                <img
                                  src={img(p)}
                                  alt={title(p)}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg(title(p), 48); }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No img</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {title(p)}
                                {score(p) && <span className="text-gray-500 ml-1">({score(p)})</span>}
                              </div>
                              {reason(p) && <div className="text-xs text-gray-500 truncate">{reason(p)}</div>}
                            </div>
                          </button>
                        ))
                      ) : searchCompleted ? (
                        <div className="p-3 text-sm text-gray-500 text-center">No results found.</div>
                      ) : (
                        <div className="p-3 text-xs text-gray-500">Searching\u2026</div>
                      )}
                    </div>

                    {searchSummary && (
                      <div className="border-t bg-blue-50 text-sm p-3 flex-shrink-0">
                        {searchSummary}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="h-14 px-8 rounded-lg bg-[#1B5A8E] text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1D4C73] transition shadow-lg"
                disabled={!hasKey || searchLoading || charCount < 3}
              >
                {searchLoading ? "Searching\u2026" : "Search"}
              </button>
            </form>
            {!hasKey && (
              <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Demo is not configured: missing <span className="font-mono">VITE_INOPS_SEARCH_KEY</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="w-full bg-gray-50 py-12 border-t-2 border-gray-300">
        <div className="max-w-[1080px] mx-auto px-6 md:px-20">
          <h2 className="text-2xl font-semibold text-[#0F3253] mb-2">Shop Inventory</h2>
          <p className="text-sm text-gray-600 mb-6">Browse all available products in our catalog</p>

          {Array.isArray(inventoryProducts) && inventoryProducts.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F3253]">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F3253]">Brand</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F3253]">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#0F3253]">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryProducts.map((p) => (
                    <tr key={String(p?.id || p?.productId || "")} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-[#0F3253]">{title(p)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{brand(p) || <span className="text-gray-400">&mdash;</span>}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{category(p) || <span className="text-gray-400">&mdash;</span>}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{description(p) || <span className="text-gray-400">&mdash;</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">No products found in inventory.</div>
          )}
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        homepageUrl={homepageUrl}
        product={selectedProduct}
        similar={similarProducts}
        loading={similarLoading}
        error={similarError}
        onClose={() => setModalOpen(false)}
        onSelectSimilar={openProduct}
      />
    </div>
  );
}
