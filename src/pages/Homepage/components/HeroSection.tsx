import React, { useEffect, useRef, useState } from "react";
import bgImage from "../../../assets/images/background.png";
import iconSearch from "../../../assets/icons/icon_search.svg";
import { getSearchApiUrl } from "../../../config/api";

const HeroSection: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  console.log("Search results:", results);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

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
        console.log("API response data:", data);
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
      //
    }
  };

  const performSearch = async (searchQuery: string) => {
    const searchResults = await callSearchApi(searchQuery);
    setResults(searchResults);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (query.trim().split(/\s+/).length > 2) {
        performSearch(query);
      }
    }
  };

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

          <div className="flex flex-row items-center bg-white rounded-lg shadow-lg border-2 border-[#6BD7FF] w-[400px] px-4 py-3.5 gap-2.5">
            <img src={iconSearch} alt="Logo" className="w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search"
              className="w-full h-6 outline-none transition-all text-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSection);
