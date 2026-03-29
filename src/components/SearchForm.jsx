import { useState, useEffect, useRef } from "react";
import { getSearchApiUrl } from "../config/api";

const SearchForm = ({
  placeholder = "Search",
  maxWidth = "500px",
  searchKey = "",
  apiUrl = "",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setShowResults(!!query.trim());
    if (!query) setResults([]);
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery.trim().split(/\s+/).length > 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

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
    setIsLoading(true);
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
      });
      if (!res.ok) return [];
      const data = await res.json();
      const sessionId = data.sessionId;
      if (!sessionId) return [];

      // Stream results via SSE
      return new Promise((resolve, reject) => {
        const allData = [];
        const eventSource = new EventSource(
          `${baseUrl}/sse/session/${sessionId}?searchKey=${encodeURIComponent(key)}`
        );

        const timeout = setTimeout(() => {
          eventSource.close();
          resolve(allData);
        }, 30000);

        eventSource.onmessage = (event) => {
          try {
            const streamData = JSON.parse(event.data);
            const ev = streamData?.event || "";

            if (ev === "products" || ev === "summary-result") {
              const widgets = streamData.data?.response?.widgets || streamData.response?.widgets || [];
              allData.push(...widgets);
            }

            if (ev === "flow-end") {
              clearTimeout(timeout);
              eventSource.close();
              resolve(allData);
            } else if (ev === "flow-error") {
              clearTimeout(timeout);
              eventSource.close();
              reject(new Error("Flow error"));
            }
          } catch {
            // ignore parse errors
          }
        };

        eventSource.onerror = () => {
          clearTimeout(timeout);
          eventSource.close();
          resolve(allData);
        };
      });
    } catch {
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (searchQuery) => {
    const searchResults = await callSearchApi(searchQuery);
    setResults(searchResults);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && query.trim().split(/\s+/).filter(Boolean).length > 2) {
      performSearch(query);
    }
  };

  const handleOnFocus = () => {
    if (results.length > 0) setShowResults(true);
  };

  const imgUrl = (result) =>
    result?.image || result?.imageUrl || result?.metadata?.imageUrl || "";

  return (
    <div className="w-full" style={{ maxWidth }}>
      <div className="relative flex flex-row items-center bg-white rounded-lg shadow-lg border-2 border-[#6BD7FF] w-full px-4 py-3.5 gap-2.5">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setIsLoading(true);
            setQuery(e.target.value);
          }}
          onKeyDown={handleInputKeyDown}
          onFocus={handleOnFocus}
          placeholder={placeholder}
          className="w-full h-6 outline-none border-none transition-all text-lg"
        />
        {showResults && (
          <div
            ref={wrapperRef}
            className="absolute overflow-y-auto top-14 right-0 left-0 h-96 z-10 bg-white shadow-2xl rounded-lg"
          >
            {isLoading ? (
              <div className="w-full flex justify-center mt-4">
                <div className="spinner" />
              </div>
            ) : results.length > 0 ? (
              results.map((result, index) => (
                <div key={index}>
                  {result.type === "product" ? (
                    <div className="flex flex-row items-center gap-8 p-4 border-b border-gray-200">
                      <img
                        src={imgUrl(result) || "https://placehold.co/60x60/E5E7EB/6B7280?text=Product"}
                        alt={result.title || "Product"}
                        className="rounded w-[60px] h-[60px] object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/60x60/E5E7EB/6B7280?text=Product";
                        }}
                      />
                      <div>
                        <p className="font-semibold text-sky-600 text-sm">
                          {result.title} ({(result.score * 100).toFixed(0)}%)
                        </p>
                        {result.reason && (
                          <>
                            <p className="text-xs font-medium mt-1 text-gray-400">Reason</p>
                            <p className="text-sm">{result.reason}</p>
                          </>
                        )}
                        {result.metadata?.productUrl && (
                          <a
                            href={result.metadata.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                          >
                            View Product &rarr;
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="text-xs font-medium text-sky-500">Summary</p>
                      <p className="text-xs">{result.value}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="w-full flex justify-center mt-4 text-sm text-gray-500">No results found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchForm;
