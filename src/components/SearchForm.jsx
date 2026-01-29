import { useState, useEffect, useRef } from "react";
import { getSearchApiUrl } from "../config/api";
import io from "socket.io-client";

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
      const headers = { "Content-Type": "application/json", "x-search-key": key };
      const res = await fetch(`${baseUrl}/shop/flow/execute`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          language: "en",
          userInput: { type: "search", value: searchQuery },
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const sessionId = data.sessionId;
      if (!sessionId) return [];

      return new Promise((resolve, reject) => {
        const socket = io(`${baseUrl}?searchKey=${key}`, { transports: ["websocket"] });
        const allData = [];
        socket.on("connect", () => {
          socket.emit("subscribe-session", { sessionId });
          socket.on(`session-${sessionId}`, (streamData) => {
            if (streamData.event === "products" || streamData.event === "summary-result") {
              const widgets = streamData.data?.response?.widgets || streamData.response?.widgets || [];
              allData.push(...widgets);
            }
            if (streamData.event === "flow-end") {
              socket.disconnect();
              resolve(allData);
            } else if (streamData.event === "flow-error") {
              socket.disconnect();
              reject(new Error("Flow error"));
            }
          });
        });
        socket.on("connect_error", (err) => {
          socket.disconnect();
          reject(err);
        });
        setTimeout(() => {
          socket.disconnect();
          reject(new Error("Search timeout"));
        }, 30000);
      });
    } catch (e) {
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
                        src={result.metadata?.imageUrl || "https://placehold.co/60?text=Product&font=roboto"}
                        alt="product"
                        className="rounded w-[60px] h-[60px] object-cover"
                      />
                      <div>
                        <p className="font-semibold text-sky-600 text-sm">
                          {result.title} ({(result.score * 100).toFixed(2)}%)
                        </p>
                        <p className="text-xs font-medium mt-1 text-gray-400">Reason</p>
                        <p className="text-sm">{result.reason}</p>
                        {result.metadata?.productUrl && (
                          <a
                            href={result.metadata.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                          >
                            View Product →
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
              <div className="w-full flex justify-center mt-4">No data found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchForm;
