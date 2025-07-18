import React, { useState } from "react";

const DUMMY_SUGGESTIONS = [
  "longboard",
  "surf skate",
  "wheels",
  "bearings",
  "accessories",
  "decks",
];

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered =
    query.length === 0
      ? []
      : DUMMY_SUGGESTIONS.filter((item) =>
          item.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="relative w-full max-w-2xl">
      <input
        className="w-full border rounded-full px-6 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow"
        placeholder="Search for products..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
      />
      {showDropdown && query && (
        <div className="absolute left-0 right-0 mt-2 bg-white shadow-lg rounded-md z-10">
          {filtered.length ? (
            filtered.map((s, idx) => (
              <div
                key={idx}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                onMouseDown={() => {
                  setQuery(s);
                  setShowDropdown(false);
                }}
              >
                {s}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-400">No suggestions</div>
          )}
        </div>
      )}
    </div>
  );
}