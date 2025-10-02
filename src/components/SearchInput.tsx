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
    <div className={`relative flex flex-row items-center bg-white rounded-lg shadow-lg border-2 border-[#6BD7FF] w-full px-4 py-3.5 gap-2.5 ${className}`} style={{ maxWidth }}>
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
              <div className="flex justify-center mt-4">
                No data found
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchInput);
