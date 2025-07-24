import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface SearchItem {
  title: string;
  image?: string;
}

const mockData: SearchItem[] = [
  { title: "surfboard" },
  { title: "surfboards" },
  { title: "Surfboard bag" },
  {
    title: "NSP Elements Longboard surfboard 8ft 0 Package - Navy",
    image: "/images/board-navy.webp",
  },
  {
    title: "NSP Elements Longboard surfboard 8ft 0 Package - White",
    image: "/images/board-white.webp",
  },
  {
    title: "NSP Elements Longboard Surfboard 8ft 6 Package - Red",
    image: "/images/board-red.webp",
  },
  {
    title: "NSP Elements Funboard surfboard 6ft 8 Package - White",
    image: "/images/board-fun-white.webp",
  },
  { title: "DB Journey" },
  { title: "Surfboard Bags" },
  { title: "Multi Travel Bags" },
];

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = mockData.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      navigate(
        `/shopify-dummy-shop/search/?q=${encodeURIComponent(query.trim())}`
      );
      setShowDropdown(false);
    }
  };

  return (
    <div className="w-full flex justify-center mt-6 relative">
      <div className="w-[90%] max-w-xl relative">
        <div className="flex items-center border border-gray-300 rounded-full px-4 py-3 shadow-sm bg-white">
          <span className="text-gray-500 mr-3 text-lg">🔍</span>
          <input
            type="text"
            className="flex-grow outline-none text-base placeholder-gray-400"
            placeholder="Search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setShowDropdown(false);
              }}
              className="text-xl text-gray-500"
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>

        {showDropdown && query && (
          <ul className="absolute z-10 w-full bg-white shadow-lg max-h-96 overflow-y-auto border border-t-0 rounded-b-xl">
            {filtered.length > 0 ? (
              filtered.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setQuery(item.title);
                    setShowDropdown(false);
                  }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-9 h-9 object-contain"
                    />
                  )}
                  <span className="text-sm">{item.title}</span>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-gray-500 text-sm">
                No results found
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
