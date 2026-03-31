import { useState, useEffect, useRef } from "react";
import { getSearchApiUrl } from "../config/api";

const SearchForm = ({
  placeholder = "Search products...",
  maxWidth = "600px",
  searchKey = "",
  apiUrl = "",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!query) { setResults([]); setBundles([]); setShowResults(false); }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const callSearchApi = async (searchQuery) => {
    // Abort any previous in-flight search
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setResults([]);
    setBundles([]);
    setShowResults(true);

    try {
      const baseUrl = apiUrl || getSearchApiUrl();
      const key = searchKey || "";
      const res = await fetch(`${baseUrl}/shop/flow/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Search-Key": key,
        },
        body: JSON.stringify({
          language: "en",
          userInput: { type: "search", value: searchQuery },
        }),
        signal: controller.signal,
      });
      if (!res.ok) { setIsLoading(false); return; }
      const data = await res.json();
      const sessionId = data.sessionId;
      if (!sessionId) { setIsLoading(false); return; }

      // Stream results via SSE — collect ALL events before closing
      await new Promise((resolve) => {
        const allData = [];
        const collectedBundles = [];
        const eventSource = new EventSource(
          `${baseUrl}/sse/session/${sessionId}?searchKey=${encodeURIComponent(key)}`
        );

        const timeout = setTimeout(() => {
          eventSource.close();
          if (collectedBundles.length > 0) setBundles([...collectedBundles]);
          setResults([...allData]);
          setIsLoading(false);
          resolve();
        }, 30000);

        // Abort cleanup
        controller.signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          eventSource.close();
          resolve();
        });

        eventSource.onmessage = (event) => {
          try {
            const streamData = JSON.parse(event.data);
            const ev = streamData?.event || "";

            if (ev === "bundle-result") {
              const response = streamData?.response || streamData?.data?.response || {};
              collectedBundles.push(response);
              setBundles([...collectedBundles]);
              return;
            }

            if (ev === "products" || ev === "summary-result") {
              const widgets = streamData.data?.response?.widgets || streamData.response?.widgets || [];
              allData.push(...widgets);
            }

            if (ev === "flow-end") {
              clearTimeout(timeout);
              eventSource.close();
              setResults([...allData]);
              setIsLoading(false);
              resolve();
            } else if (ev === "flow-error") {
              clearTimeout(timeout);
              eventSource.close();
              setResults([...allData]);
              setIsLoading(false);
              resolve();
            }
          } catch {
            // ignore parse errors
          }
        };

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          if (collectedBundles.length > 0) setBundles([...collectedBundles]);
          setResults([...allData]);
          setIsLoading(false);
          resolve();
        };
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        setIsLoading(false);
      }
    }
  };

  const performSearch = (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (typeof gtag === "function") {
      gtag("event", "search", { search_term: trimmed });
    }
    callSearchApi(trimmed);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      performSearch(query);
    }
  };

  const handleSearchClick = () => {
    if (query.trim()) performSearch(query);
  };

  const handleOnFocus = () => {
    if (results.length > 0 || bundles.length > 0) setShowResults(true);
  };

  const imgUrl = (result) =>
    result?.image || result?.imageUrl || result?.metadata?.imageUrl || "";

  const bundleTotal = (bundle) =>
    bundle.groups.reduce(
      (sum, g) => sum + (g.products || []).reduce((s, p) => s + (parseFloat(p.price) || 0), 0),
      0,
    );

  const renderBundle = (bundle, idx) => {
    const total = bundleTotal(bundle);
    const overBudget = bundle.budget && total > bundle.budget;

    return (
      <div key={idx} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
        {/* Bundle header */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                {bundles.length > 1 ? `Bundle #${idx + 1}` : "Bundle"}
              </span>
              <span className="text-sm font-medium text-gray-700">{bundle.intent}</span>
            </div>
            {bundle.budget && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  overBudget ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                Budget: ${bundle.budget}
              </span>
            )}
          </div>
        </div>

        {/* Bundle groups */}
        <div className="p-3">
          {bundle.groups.map((group, gIdx) => (
            <div key={gIdx} className="mb-3 last:mb-0">
              {/* Category label */}
              <div className="mb-1.5 ml-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>

              {/* Products — indented */}
              {(group.products || []).map((p, pIdx) => (
                <div
                  key={pIdx}
                  className="flex items-center gap-3 ml-4 p-2.5 bg-white border border-gray-100 rounded-lg hover:border-gray-300 hover:shadow-sm transition"
                >
                  <img
                    src={imgUrl(p) || "https://placehold.co/48x48/E5E7EB/6B7280?text=No+img"}
                    alt={p.title || "Product"}
                    className="rounded-lg w-12 h-12 object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/48x48/E5E7EB/6B7280?text=No+img";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.brand && <span className="text-xs text-gray-400">{p.brand}</span>}
                      {p.color && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">
                          {p.color}
                        </span>
                      )}
                    </div>
                  </div>
                  {p.price != null && (
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      ${parseFloat(p.price).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bundle footer — total + budget comparison */}
        <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {bundle.groups.length} categories &middot;{" "}
            {bundle.groups.reduce((n, g) => n + (g.products?.length || 0), 0)} items
          </span>
          <div className="flex items-center gap-3">
            {bundle.budget && (
              <span className={`text-xs ${overBudget ? "text-red-600" : "text-green-600"}`}>
                {overBudget
                  ? `$${(total - bundle.budget).toFixed(2)} over budget`
                  : `$${(bundle.budget - total).toFixed(2)} under budget`}
              </span>
            )}
            <span className="text-sm font-bold text-gray-900">Total: ${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderProduct = (result, index) => (
    <div
      key={index}
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
      onClick={() => {
        if (result.metadata?.productUrl) {
          if (typeof gtag === "function") {
            gtag("event", "select_item", {
              item_id: result.productId || result.metadata?.productId,
              item_name: result.title,
              item_brand: result.brand,
              item_category: result.category || result.productType,
              price: result.price,
            });
          }
          window.open(result.metadata.productUrl, "_blank");
        }
      }}
    >
      <img
        src={imgUrl(result) || "https://placehold.co/48x48/E5E7EB/6B7280?text=Product"}
        alt={result.title || "Product"}
        className="rounded-lg w-12 h-12 object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/48x48/E5E7EB/6B7280?text=Product";
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-gray-900 truncate">{result.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {result.brand && <span className="text-xs text-gray-400">{result.brand}</span>}
          {result.reason && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">{result.reason}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        {result.price != null && (
          <span className="text-sm font-bold text-gray-900">${parseFloat(result.price).toFixed(2)}</span>
        )}
        {result.score != null && (
          <span className="text-[10px] text-gray-400">{(result.score * 100).toFixed(0)}% match</span>
        )}
      </div>
    </div>
  );

  const hasResults = bundles.length > 0 || results.length > 0;

  return (
    <div className="w-full" style={{ maxWidth }}>
      <div ref={wrapperRef} className="relative">
        {/* Search input */}
        <div className="flex items-center bg-white rounded-lg shadow-lg border-2 border-[#6BD7FF] w-full px-4 py-3 gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={handleOnFocus}
            placeholder={placeholder}
            className="w-full h-6 outline-none border-none text-base"
          />
          <button
            onClick={handleSearchClick}
            disabled={isLoading || !query.trim()}
            className="flex-shrink-0 bg-[#1a56db] hover:bg-[#1e429f] disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-md transition"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Results dropdown */}
        {showResults && (isLoading || hasResults) && (
          <div className="absolute top-full mt-1 left-0 right-0 max-h-[520px] overflow-y-auto z-10 bg-white shadow-2xl rounded-lg border border-gray-200">
            {isLoading && !hasResults ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-gray-500">Searching...</span>
              </div>
            ) : (
              <>
                {/* Bundles */}
                {bundles.length > 0 && (
                  <div className="p-3">
                    {bundles.map((bundle, idx) => renderBundle(bundle, idx))}
                    {isLoading && (
                      <div className="flex items-center justify-center gap-2 py-3">
                        <svg className="animate-spin h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span className="text-xs text-gray-400">Loading more bundles...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Linear results (only show if no bundles) */}
                {bundles.length === 0 && results.length > 0 && (
                  <div>
                    {results
                      .filter((r) => r.type === "product")
                      .map((result, index) => renderProduct(result, index))}
                    {results
                      .filter((r) => r.type !== "product")
                      .map((result, index) => (
                        <div key={`s-${index}`} className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                          <p className="text-xs font-medium text-blue-600 mb-0.5">AI Summary</p>
                          <p className="text-sm text-gray-700">{result.value}</p>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchForm;
