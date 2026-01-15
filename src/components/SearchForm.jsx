<<<<<<< Updated upstream
import { useState, useEffect, useRef } from "react";
import { getSearchApiUrl } from "../config/api";
import io from "socket.io-client";
=======
import { useState, useEffect, useRef, useCallback } from 'react';
import { INOPS_CONFIG } from '../config/api';
>>>>>>> Stashed changes

const SearchForm = ({
  placeholder = "Search",
  maxWidth = "500px",
  searchKey = "",
  apiUrl = "",
}) => {
  // Debug: Log props immediately on component mount
  console.log("SearchForm: Component rendered with props:", {
    placeholder,
    maxWidth,
    searchKey: searchKey ? `"${searchKey}"` : "EMPTY/UNDEFINED",
    apiUrl,
  });
  console.log("SearchForm: searchKey length:", searchKey?.length || 0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef(null);

  // Debounce effect for input
  useEffect(() => {
    setShowResults(!!query.trim());

    if (!query) {
      setResults([]);
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

<<<<<<< Updated upstream
  // Search effect
  useEffect(() => {
    if (
      debouncedQuery.trim() &&
      debouncedQuery.trim().split(/\s+/).length > 2
    ) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  // Click outside handler
=======
  // Focus input when opened and handle keyboard events
>>>>>>> Stashed changes
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

<<<<<<< Updated upstream
  // API handler for search with WebSocket streaming
  const callSearchApi = async (searchQuery) => {
    setIsLoading(true);
    try {
      const baseUrl = apiUrl || getSearchApiUrl();

      console.log(
        "SearchForm: API call with searchKey:",
        searchKey ? "***" + searchKey.slice(-4) : "MISSING"
      );
      console.log("SearchForm: searchKey type:", typeof searchKey);
      console.log("SearchForm: searchKey value (raw):", searchKey);
      console.log("SearchForm: searchKey empty?:", searchKey === "");
      console.log("SearchForm: API URL:", baseUrl);

      // Step 1: Execute flow to get sessionId
      const headers = {
        "Content-Type": "application/json",
        "x-search-key": searchKey,
      };

      console.log("SearchForm: Headers object:", headers);
      console.log(
        "SearchForm: x-search-key in headers:",
        headers["x-search-key"]
      );

      const response = await fetch(`${baseUrl}/shop/flow/execute`, {
        method: "POST",
        headers: headers,
=======
  // API handler for both search and suggestions
  const callSearchApi = useCallback(async (searchQuery, type) => {
    setIsLoading(true);
    try {
      const baseUrl = String(INOPS_CONFIG.apiBaseUrl || 'http://127.0.0.1:3000').replace(/\/$/, '');
      const searchKey = String(INOPS_CONFIG.searchKey || '').trim();
      const url = `${baseUrl}/shop/flow/execute?searchKey=${encodeURIComponent(searchKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(searchKey ? { 'X-Search-Key': searchKey, Authorization: `SearchKey ${searchKey}` } : {}),
        },
>>>>>>> Stashed changes
        body: JSON.stringify({
          language: 'en',
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
          "SearchForm: Connecting to WebSocket...",
          `${baseUrl}?searchKey=${searchKey}`
        );
        const socket = io(`${baseUrl}?searchKey=${searchKey}`, {
          transports: ["websocket"],
        });
        console.log("SearchForm: Socket object created:", socket);

        const allData = [];

        socket.on("connect", () => {
          console.log("SearchForm: WebSocket connected successfully!");
          console.log("SearchForm: Subscribing to session:", sessionId);
          socket.emit("subscribe-session", { sessionId });

          socket.on(`session-${sessionId}`, (streamData) => {
            console.log(
              "SearchForm: *** RECEIVED DATA FROM SOCKET ***",
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

        socket.on("connect_error", (err) => {
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
      setIsLoading(false);
    }
  }, []);

<<<<<<< Updated upstream
  // Perform full search
  const performSearch = async (searchQuery) => {
    const searchResults = await callSearchApi(searchQuery);
=======
  // Fetch suggestions (type: 'partial')
  const fetchSuggestions = useCallback(async (searchQuery) => {
    setIsSuggesting(true);
    const suggestionResults = await callSearchApi(searchQuery, 'partial');
    setSuggestions(suggestionResults);
    setIsSuggesting(false);
  }, [callSearchApi]);

  // Perform full search (type: 'search')
  const performSearch = useCallback(async (searchQuery) => {
    setIsSuggesting(false);
    const searchResults = await callSearchApi(searchQuery, 'search');
>>>>>>> Stashed changes
    setResults(searchResults);
  }, [callSearchApi]);

  // Suggestion and search effect
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery.trim().split(/\s+/).length > 2) {
      fetchSuggestions(debouncedQuery);
      performSearch(debouncedQuery);
    } else {
      setSuggestions([]);
      setResults([]);
    }
  }, [debouncedQuery, fetchSuggestions, performSearch]);

  // Handle Enter key for search
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      if (query.trim().split(/\s+/).length > 2) {
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
                        src={
                          result.metadata?.imageUrl ||
                          "https://placehold.co/60?text=Product&font=roboto"
                        }
                        alt="product"
                        className="rounded w-[60px] h-[60px] object-cover"
                      />
                      <div>
                        <p className="font-semibold text-sky-600 text-sm">
                          {result.title} ({(result.score * 100).toFixed(2)}%)
                        </p>
                        <p className="text-xs font-medium mt-1 text-gray-400">
                          Reason
                        </p>
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

export default SearchForm;
