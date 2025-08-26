import React, { useEffect, useRef, useState } from "react";
import bgImage from "../../../assets/images/background.png";
import iconSearch from "../../../assets/icons/icon_search.svg";
import { getSearchApiUrl } from "../../../config/api";

type Product = {
  title: string;
  score: number;
  reason: string;
};

const HeroSection: React.FC = () => {
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
    // const timer = setTimeout(() => {
    //   if (query.trim().split(/\s+/).length > 2) {
    //     setDebouncedQuery(query);
    //   }
    // }, 500);
    // return () => clearTimeout(timer);
  }, [query]);

  // useEffect(() => {
  //   if (debouncedQuery.trim()) {
  //     performSearch(debouncedQuery);
  //   } else {
  //     setResults([]);
  //   }
  // }, [debouncedQuery]);

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
    <div
      className="h-[700px] bg-cover bg-center pt-24"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)`,
        }}
      ></div>
      <div className="relative">
        <div className="flex flex-col items-center">
          <div className="text-6xl font-extrabold text-[#1D4C73] mt-6">
            Shopify Dummy Shop
          </div>

          <div className="text-xl font-normal my-6 text-[#1B5A8E]">
            Try our AI powered search — faster, smarter, and spot-on every time!
          </div>

          <div className="relative flex flex-row items-center bg-white rounded-lg shadow-lg border-2 border-[#6BD7FF] w-[500px] px-4 py-3.5 gap-2.5">
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
              placeholder="Search"
              className="w-full h-6 outline-none transition-all text-lg"
            />

            {showResults && (
              <div
                ref={wrapperRef}
                className="absolute overflow-y-auto top-14 right-0 left-0 h-80 z-10 bg-white shadow-2xl rounded-lg"
              >
                {loading ? (
                  <div className="w-full flex justify-center mt-4">
                    <div className="spinner" />
                  </div>
                ) : results.length > 0 ? (
                  results.map((result, index) => (
                    <div
                      key={index}
                      className="flex flex-row items-center gap-8 p-4 border-b border-gray-200"
                    >
                      <img
                        src="https://placehold.co/60?text=Placeholder&font=roboto"
                        alt="product image"
                        className="rounded"
                      />

                      <div>
                        <p className="font-semibold text-sky-600 text-sm">{`${result.title} (${result.score})`}</p>

                        <p className="text-sm">{result.reason}</p>
                      </div>
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
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSection);
