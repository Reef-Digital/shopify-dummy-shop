import React, { useEffect, useRef, useState } from "react";
import { getSearchApiUrl } from "../config/api";
import io from "socket.io-client";

type Product = {
  title: string;
  score: number;
  reason: string;
  type: "product" | "text";
  value: string;
  productId?: string;
  product?: any;
};

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (results: Product[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  maxWidth?: string;
  debounceMs?: number;
  searchKey?: string;
  apiUrl?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search",
  className = "",
  onSearch,
  onLoadingChange,
  maxWidth = "500px",
  debounceMs = 1000,
  searchKey = "",
  apiUrl = "",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowResults(!!query.trim());

    if (!query) {
      setResults([]);
    }
    const timer = setTimeout(() => {
      if (query.trim().split(/\s+/).length > 1) {
        setDebouncedQuery(query);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (onSearch) {
      onSearch(results);
    }
  }, [results, onSearch]);

  const callSearchApi = async (searchQuery: string): Promise<Product[]> => {
    setLoading(true);
    try {
      const baseUrl = apiUrl || getSearchApiUrl();

      console.log(
        "SearchInput: API call with searchKey:",
        searchKey ? "***" + searchKey.slice(-4) : "MISSING"
      );
      console.log("SearchInput: API URL:", baseUrl);

      // Step 1: Execute flow to get sessionId
      const response = await fetch(`${baseUrl}/shop/flow/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-search-key": searchKey,
        },
        body: JSON.stringify({
          userInput: {
            type: "search",
            value: searchQuery,
          },
        }),
      });

      if (!response.ok) {
        console.error(
          "API response error:",
          response.status,
          response.statusText
        );
        return [];
      }

      const data = await response.json();
      const sessionId = data.sessionId;

      if (!sessionId) {
        console.error("No sessionId returned from API");
        return [];
      }

      // Step 2: Connect to WebSocket and stream results
      return new Promise((resolve, reject) => {
        console.log(
          "SearchInput: Connecting to WebSocket...",
          `${baseUrl}?token=${searchKey}`
        );
        const socket = io(`${baseUrl}?token=${searchKey}`, {
          transports: ["websocket"],
        });
        console.log("SearchInput: Socket object created:", socket);

        const allData: Product[] = [];

        socket.on("connect", () => {
          console.log("SearchInput: WebSocket connected successfully!");
          console.log("SearchInput: Subscribing to session:", sessionId);
          socket.emit("subscribe-session", { sessionId });

          socket.on(`session-${sessionId}`, (streamData: any) => {
            console.log(
              "SearchInput: *** RECEIVED DATA FROM SOCKET ***",
              streamData
            );

            if (
              streamData.event === "products" ||
              streamData.event === "summary-result"
            ) {
              const widgets =
                streamData.data?.response?.widgets ||
                streamData.response?.widgets ||
                [];
              allData.push(...widgets);
            }

            if (streamData.event === "flow-end") {
              console.log("Flow ended, collected widgets:", allData);
              socket.disconnect();
              resolve(allData);
            } else if (streamData.event === "flow-error") {
              console.error("Flow error:", streamData);
              socket.disconnect();
              reject(new Error("Flow error"));
            }
          });
        });

        socket.on("connect_error", (err: Error) => {
          console.error("Socket error:", err);
          socket.disconnect();
          reject(err);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          socket.disconnect();
          reject(new Error("Search timeout"));
        }, 30000);
      });
    } catch (error) {
      console.error("Search error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (searchQuery: string) => {
    const searchResults = await callSearchApi(searchQuery);
    setResults(searchResults);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (query.trim().split(/\s+/).length > 1) {
        performSearch(query);
      }
    }
  };

  const handleOnFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div className={`w-full ${className}`} style={{ maxWidth }}>
      <div className="relative flex flex-row items-center bg-white rounded-lg shadow-lg border-2 border-[#6BD7FF] w-full px-4 py-3.5 gap-2.5">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setLoading(true);
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
            {loading ? (
              <div className="w-full flex justify-center mt-4">
                <div className="spinner" />
              </div>
            ) : results.length > 0 ? (
              results.map((result, index) => (
                <div key={index}>
                  {result.type === "product" ? (
                    <div className="flex flex-row items-center gap-8 p-4 border-b border-gray-200">
                      <img
                        src="https://placehold.co/60?text=Product&font=roboto"
                        alt="product"
                        className="rounded"
                      />
                      <div>
                        <p className="font-semibold text-sky-600 text-sm">
                          {result.title} ({(result.score * 100).toFixed(2)}%)
                        </p>
                        <p className="text-xs font-medium mt-1 text-gray-400">
                          Reason
                        </p>
                        <p className="text-sm">{result.reason}</p>
                        {result.product?.productUrl && (
                          <a
                            href={result.product.productUrl}
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
                      <p className="text-xs font-medium text-sky-500">
                        Summary
                      </p>
                      <p className="text-xs">{result.value}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="w-full flex justify-center mt-4">
                <div className="flex justify-center mt-4">No data found</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(SearchInput);
