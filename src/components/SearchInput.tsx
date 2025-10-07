import React, { useEffect, useRef, useState } from "react";
import iconSearch from "../assets/icons/icon_search.svg";
import { getSearchApiUrl } from "../config/api";

type Product = {
  title: string;
  score: number;
  reason: string;
  type: "product" | "text";
  value: string;
};

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (results: Product[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  maxWidth?: string;
  debounceMs?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search",
  className = "",
  onSearch,
  onLoadingChange,
  maxWidth = "500px",
  debounceMs = 1000,
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
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (onSearch) {
      onSearch(results);
    }
  }, [results, onSearch]);

  const callSearchApi = async (searchQuery: string) => {
    try {
      const apiUrl = getSearchApiUrl();
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: {
            type: "search",
            value: searchQuery,
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data || [];
      } else {
        console.error(
          "API response error:",
          response.status,
          response.statusText
        );
        return [];
      }
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

  return (
    <div className={`w-full ${className}`} style={{ maxWidth }}>
      {/* Disclaimer */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              Disclaimer
            </h3>
            <p className="text-sm text-blue-700 mb-2">
              This demo shop contains a limited selection of products for
              testing only. Search results are restricted to this sample
              inventory.
            </p>
            <p className="text-sm text-blue-700">
              <span className="inline-block mr-1">👉</span> To explore, try
              searching for categories like Surfboards, Wetsuits, Accessories,
              or Lifestyle items, or look up products by name such as Longboard,
              Wetsuit, Wax, Hoodie, or Flip Flops.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative flex flex-row items-center bg-white rounded-lg shadow-lg border-2 border-[#6BD7FF] w-full px-4 py-3.5 gap-2.5">
        <img src={iconSearch} alt="search" className="w-4 h-4" />
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
                        src="https://placehold.co/60?text=Placeholder&font=roboto"
                        alt="product image"
                        className="rounded"
                      />

                      <div>
                        <p className="font-semibold text-sky-600 text-sm">{`${
                          result.title
                        } (${(result.score * 100).toFixed(2)}%)`}</p>

                        <p className="text-xs font-medium mt-1 text-gray-400">
                          Reason
                        </p>
                        <p className="text-sm">{result.reason}</p>

                        <p className="font-semibold text-sm mt-1">$15.46</p>
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
