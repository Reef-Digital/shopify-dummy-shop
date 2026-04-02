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
  const [showDropdown, setShowDropdown] = useState(false);
  const searchAreaRef = useRef(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [bundleResults, setBundleResults] = useState([]);
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
    setShowDropdown(true);

    cleanupSearch();
    isSearchingRef.current = true;
    searchIdsRef.current.clear();
    setSearchLoading(true);
    setSearchError("");
    setSearchSummary("");
    setSearchProducts([]);
    setSearchCompleted(false);
    setBundleResults([]);

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

        // Bundle result detection — collect all bundles, keep streaming
        if (ev === "bundle-result") {
          const response = evt?.response || evt?.data?.response || {};
          setBundleResults((prev) => [...prev, response]);
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
  const [cartToast, setCartToast] = useState("");
  const showCartToast = useCallback((msg) => {
    setCartToast(msg);
    setTimeout(() => setCartToast(""), 2000);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");
  const [similarProducts, setSimilarProducts] = useState([]);
  const similarUnsubRef = useRef(null);

  const openProduct = useCallback(async (p) => {
    setSelectedProduct(p);
    setModalOpen(true);
    const pid = String(p?.productId || p?.id || "").trim();
    if (!pid || !hasKey || !inopsClient) return;

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
    function handleClickOutside(e) {
      if (searchAreaRef.current && !searchAreaRef.current.contains(e.target)) {
        setShowDropdown(false);
        // Cancel any in-flight search
        cleanupSearch();
        isSearchingRef.current = false;
        setSearchLoading(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      {/* 1. Slim top banner */}
      <div className="bg-[#0F3253] text-white text-sm px-6 py-2.5 text-center flex items-center justify-center gap-2">
        <span>This is a demo shop showcasing AI-powered product search by</span>
        <a href={homepageUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:text-[#6BD7FF] transition">
          Inops
        </a>
        <span className="mx-1">|</span>
        <a href={homepageUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-[#6BD7FF] transition">
          Learn more &rarr;
        </a>
      </div>

      {/* 2. Hero with embedded search */}
      <div
        className="relative bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})`, minHeight: "450px" }}
      >
        {/* Gradient overlay: darken top for text, fade to white at bottom */}
        <div
          className="absolute inset-0 z-0"
          style={{ background: "linear-gradient(to bottom, rgba(15,50,83,0.55) 0%, rgba(15,50,83,0.3) 50%, rgba(255,255,255,1) 100%)" }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center px-6 md:px-20 pt-14 pb-20">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-6 text-center drop-shadow-lg">
            {shopName}
          </h1>
          <p className="text-lg md:text-xl font-medium my-4 text-white/90 text-center max-w-2xl drop-shadow">
            Experience AI-powered product discovery
          </p>

          {/* Search bar */}
          <div className="w-full max-w-2xl mt-4" ref={searchAreaRef}>
            <form
              onSubmit={(e) => { e.preventDefault(); if (charCount >= 3) { setShowDropdown(true); void runSearchNow(query); } }}
              className="flex gap-3"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (charCount >= 3) setShowDropdown(true); }}
                  placeholder="e.g. longboard for beginners, gift for a surfer..."
                  className="w-full h-14 rounded-xl border-2 border-white/60 bg-white px-5 pr-12 text-lg outline-none focus:ring-2 focus:ring-[#6BD7FF] shadow-2xl"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-[#6BD7FF]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}

                {/* Results dropdown — overlays the section below */}
                {showDropdown && charCount >= 3 && (
                  <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-white shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="overflow-auto divide-y max-h-72">
                      {searchError ? (
                        <div className="p-3 text-sm text-red-600">{searchError}</div>
                      ) : bundleResults.length > 0 ? (
                        <div className="p-2">
                          {bundleResults.map((bundle, bIdx) => {
                            const total = bundle.groups?.reduce((sum, g) =>
                              sum + (g.products || []).reduce((s, p) => s + (parseFloat(p?.price) || 0), 0), 0) || 0;
                            const overBudget = bundle.budget && total > bundle.budget;
                            return (
                              <div key={bIdx} className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                                      {bundleResults.length > 1 ? `Bundle #${bIdx + 1}` : "Bundle"}
                                    </span>
                                    <span className="text-xs font-medium text-gray-600">{bundle.intent}</span>
                                  </div>
                                  {bundle.budget && (
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${overBudget ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                      Budget: ${bundle.budget}
                                    </span>
                                  )}
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {(bundle.groups || []).flatMap((group, gIdx) =>
                                    (group.products || []).map((p, pIdx) => (
                                      <button
                                        key={`${gIdx}-${pIdx}`}
                                        type="button"
                                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition flex items-center gap-3"
                                        onClick={() => openProduct(p)}
                                      >
                                        <div className="flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                                          {img(p) ? (
                                            <img src={img(p)} alt={title(p)} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg(title(p), 48); }} />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No img</div>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-semibold text-sm text-gray-900 truncate">{title(p)}</div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            {brand(p) && <span className="text-xs text-gray-400">{brand(p)}</span>}
                                            {category(p) && <span className="text-xs text-gray-400">{category(p)}</span>}
                                            {p?.color && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">{p.color}</span>}
                                          </div>
                                          {reason(p) && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{reason(p)}</div>}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {price(p) && <span className="text-sm font-bold text-gray-900">{price(p)}</span>}
                                          <span
                                            role="button"
                                            className="p-1.5 rounded-lg hover:bg-emerald-100 transition text-gray-400 hover:text-emerald-600"
                                            onClick={(e) => { e.stopPropagation(); showCartToast(`Added "${title(p)}" to cart`); }}
                                            title="Add to cart"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                            </svg>
                                          </span>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                                <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex items-center justify-end gap-3">
                                  {bundle.budget && (
                                    <span className={`text-[11px] ${overBudget ? "text-red-600" : "text-green-600"}`}>
                                      {overBudget ? `$${(total - bundle.budget).toFixed(0)} over` : `$${(bundle.budget - total).toFixed(0)} under`}
                                    </span>
                                  )}
                                  <span
                                    role="button"
                                    className="p-1.5 rounded-lg hover:bg-emerald-100 transition text-gray-400 hover:text-emerald-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const count = (bundle.groups || []).reduce((n, g) => n + (g.products?.length || 0), 0);
                                      showCartToast(`Added ${count} items to cart`);
                                    }}
                                    title="Add all to cart"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                    </svg>
                                  </span>
                                  <span className="text-sm font-bold text-gray-900">Total: ${total.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                          {searchLoading && (
                            <div className="flex items-center justify-center gap-2 py-2">
                              <svg className="animate-spin h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span className="text-xs text-gray-400">Loading more bundles...</span>
                            </div>
                          )}
                        </div>
                      ) : searchProducts.length > 0 ? (
                        searchProducts.map((p, idx) => (
                          <button
                            key={`search-${idx}`}
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
                              <div className="flex items-center gap-2 mt-0.5">
                                {price(p) && <span className="text-xs font-semibold text-[#0F3253]">{price(p)}</span>}
                                {p?.color && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{p.color}</span>}
                                {p?.gender && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">{p.gender}</span>}
                              </div>
                              {reason(p) && <div className="text-xs text-gray-500 truncate">{reason(p)}</div>}
                            </div>
                            <span
                              role="button"
                              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-emerald-100 transition text-gray-400 hover:text-emerald-600"
                              onClick={(e) => { e.stopPropagation(); showCartToast(`Added "${title(p)}" to cart`); }}
                              title="Add to cart"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                              </svg>
                            </span>
                          </button>
                        ))
                      ) : searchCompleted ? (
                        <div className="p-3 text-sm text-gray-500 text-center">No results found.</div>
                      ) : (
                        <div className="p-3 text-xs text-gray-500">Searching&hellip;</div>
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
                className="h-14 px-8 rounded-xl bg-[#1B5A8E] text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1D4C73] transition shadow-2xl"
                disabled={!hasKey}
              >
                {searchLoading ? "Searching\u2026" : "Search"}
              </button>
            </form>
          </div>

          {/* Example chips */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-white/80">Try:</span>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {[
                "blue wetsuit for women",
                "kids surfboard under $300",
                "longboard for beginners",
                "Rip Curl rash guard",
                "4/3 wetsuit",
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className="px-3.5 py-1.5 text-sm rounded-full bg-black/20 backdrop-blur-sm text-white border border-white/35 hover:bg-black/35 hover:border-white/55 transition"
                  onClick={() => { setQuery(ex); void runSearchNow(ex); }}
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {[
                "my boy wants to start surfing",
                "complete surf kit budget $500",
                "gift for a surfer",
                "cold water surfing setup",
                "getting into surfing this summer",
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className="px-3.5 py-1.5 text-sm rounded-full bg-black/20 backdrop-blur-sm text-white border border-white/35 hover:bg-black/35 hover:border-white/55 transition"
                  onClick={() => { setQuery(ex); void runSearchNow(ex); }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Results section — only visible when search has results */}
      {(searchProducts.length > 0 || bundleResults.length > 0) && !showDropdown && (
        <div className="w-full bg-white py-10">
          <div className="max-w-[1080px] mx-auto px-6 md:px-20">
            <h2 className="text-xl font-semibold text-[#0F3253] mb-4">
              {bundleResults.length > 0 ? "Bundle Results" : `${searchProducts.length} results found`}
            </h2>
            {searchSummary && (
              <p className="text-sm text-gray-600 mb-6 bg-blue-50 rounded-lg px-4 py-3">{searchSummary}</p>
            )}

            {bundleResults.length > 0 ? (
              <div className="space-y-4">
                {bundleResults.map((bundle, bIdx) => {
                  const total = bundle.groups?.reduce((sum, g) =>
                    sum + (g.products || []).reduce((s, p) => s + (parseFloat(p?.price) || 0), 0), 0) || 0;
                  const overBudget = bundle.budget && total > bundle.budget;
                  return (
                    <div key={bIdx} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                            {bundleResults.length > 1 ? `Bundle #${bIdx + 1}` : "Bundle"}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{bundle.intent}</span>
                        </div>
                        {bundle.budget && (
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${overBudget ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                            Budget: ${bundle.budget}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                        {(bundle.groups || []).flatMap((group, gIdx) =>
                          (group.products || []).map((p, pIdx) => (
                            <button
                              key={`${gIdx}-${pIdx}`}
                              type="button"
                              className="group rounded-xl border border-gray-200 bg-white hover:border-[#6BD7FF] hover:shadow-lg transition-all text-left overflow-hidden"
                              onClick={() => openProduct(p)}
                            >
                              <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                                {img(p) ? (
                                  <img src={img(p)} alt={title(p)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg(title(p), 200); }} />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  </div>
                                )}
                              </div>
                              <div className="px-3 py-3">
                                <div className="font-semibold text-sm text-[#0F3253] leading-tight line-clamp-2">{title(p)}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  {price(p) && <span className="text-sm font-bold text-gray-900">{price(p)}</span>}
                                  {brand(p) && <span className="text-xs text-gray-400">{brand(p)}</span>}
                                </div>
                                {reason(p) && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{reason(p)}</div>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-4">
                        {bundle.budget && (
                          <span className={`text-xs ${overBudget ? "text-red-600" : "text-green-600"}`}>
                            {overBudget ? `$${(total - bundle.budget).toFixed(0)} over budget` : `$${(bundle.budget - total).toFixed(0)} under budget`}
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-900">Total: ${total.toFixed(2)}</span>
                        <button
                          type="button"
                          className="ml-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
                          onClick={() => {
                            const count = (bundle.groups || []).reduce((n, g) => n + (g.products?.length || 0), 0);
                            showCartToast(`Added ${count} items to cart`);
                          }}
                        >
                          Add bundle to cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {searchProducts.map((p, idx) => (
                  <button
                    key={`result-${idx}`}
                    type="button"
                    className="group rounded-xl border border-gray-200 bg-white hover:border-[#6BD7FF] hover:shadow-lg transition-all text-left overflow-hidden"
                    onClick={() => openProduct(p)}
                  >
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                      {img(p) ? (
                        <img src={img(p)} alt={title(p)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg(title(p), 200); }} />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-3">
                      <div className="font-semibold text-sm text-[#0F3253] leading-tight line-clamp-2">{title(p)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {price(p) && <span className="text-sm font-bold text-gray-900">{price(p)}</span>}
                        {score(p) && <span className="text-xs text-gray-400">{score(p)} match</span>}
                      </div>
                      {reason(p) && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{reason(p)}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. How it works */}
      <div className="w-full bg-gray-50 py-16 border-t border-gray-200">
        <div className="max-w-[1080px] mx-auto px-6 md:px-20">
          <h2 className="text-2xl font-bold text-[#0F3253] text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Natural Language */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#1B5A8E] flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0F3253] mb-2">Natural Language</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Search like you talk. "longboard for beginners" or "gift for a surfer" — our AI understands intent.
              </p>
            </div>
            {/* Smart Bundles */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0F3253] mb-2">Smart Bundles</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Need a full kit? Describe your mission and AI assembles a curated bundle across categories.
              </p>
            </div>
            {/* Similar Products */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#6BD7FF] flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#0F3253]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#0F3253] mb-2">Similar Products</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Click any product to discover alternatives matched by AI, not just keywords.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Product catalog (collapsible) */}
      {Array.isArray(inventoryProducts) && inventoryProducts.length > 0 && (
        <div className="w-full bg-white py-10 border-t border-gray-200">
          <div className="max-w-[1080px] mx-auto px-6 md:px-20">
            <button
              type="button"
              className="w-full flex items-center justify-between group"
              onClick={(e) => {
                const panel = e.currentTarget.nextElementSibling;
                const arrow = e.currentTarget.querySelector('[data-arrow]');
                if (panel.classList.contains('hidden')) {
                  panel.classList.remove('hidden');
                  arrow.classList.add('rotate-180');
                } else {
                  panel.classList.add('hidden');
                  arrow.classList.remove('rotate-180');
                }
              }}
            >
              <div>
                <h2 className="text-xl font-bold text-[#0F3253] text-left">Browse the catalog</h2>
                <p className="text-sm text-gray-500 text-left mt-1">
                  {inventoryProducts.length} products — inspect the catalog to craft your own test queries
                </p>
              </div>
              <svg data-arrow="" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden mt-6">
              <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-[#0F3253] w-10"></th>
                      <th className="px-4 py-3 text-left font-semibold text-[#0F3253]">Title</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#0F3253]">Brand</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#0F3253]">Category</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#0F3253]">Price</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#0F3253]">Color</th>
                      <th className="px-4 py-3 text-left font-semibold text-[#0F3253]">Gender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventoryProducts.map((p, idx) => (
                      <tr key={`inv-${idx}`} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2.5">
                          <div className="w-8 h-8 rounded border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0">
                            {img(p) ? (
                              <img src={img(p)} alt={title(p)} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg(title(p), 32); }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">img</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-[#0F3253]">{title(p)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{brand(p) || "\u2014"}</td>
                        <td className="px-4 py-2.5 text-gray-600">{category(p) || "\u2014"}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-medium">{price(p) || "\u2014"}</td>
                        <td className="px-4 py-2.5">{p?.color ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{p.color}</span> : "\u2014"}</td>
                        <td className="px-4 py-2.5">{p?.gender ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">{p.gender}</span> : "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Bottom CTA */}
      <div className="w-full bg-[#0F3253] py-16">
        <div className="max-w-[1080px] mx-auto px-6 md:px-20 flex flex-col items-center text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            Ready to add AI-powered search to your Shopify store?
          </h2>
          <a
            href={homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-4 rounded-xl bg-[#6BD7FF] text-[#0F3253] text-lg font-bold hover:bg-[#5bc4eb] transition shadow-lg"
          >
            Install Inops — Free
          </a>
          <p className="text-sm text-white/60 mt-4">No credit card required. Works with any Shopify store.</p>
        </div>
      </div>

      {/* Cart toast */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{cartToast}</span>
        </div>
      )}

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
