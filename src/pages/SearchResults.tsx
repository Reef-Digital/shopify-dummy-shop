import { useLocation } from "react-router-dom";
import React from "react";
import NavBar from "../components/NavBar";
import ProductCard from "../components/ProductCard";
import imageSearch1 from "../assets/images/search-image-1.jpg";
import imageSearch2 from "../assets/images/search-image-2.jpg";
import imageSearch3 from "../assets/images/search-image-3.jpg";

const mockData = [
  {
    name: "Cortez Fugitive Surfboard 7ft 4 Futures Package - Grey",
    image: imageSearch1,
    oldPrice: 552.5,
    newPrice: 524.88,
    discountPercent: 5,
  },
  {
    name: "Cortez Fugitive Surfboard 7ft 6 Futures Package - White",
    image: imageSearch2,
    oldPrice: 552.5,
    newPrice: 524.88,
    discountPercent: 5,
  },
  {
    name: "Cortez Fugitive Surfboard 8ft 0 Futures Package - Grey",
    image: imageSearch3,
    oldPrice: 552.5,
    newPrice: 524.88,
    discountPercent: 5,
  },
];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResults: React.FC = () => {
  const query = useQuery().get("q");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />

      <div className="px-6 py-10 max-w-7xl mx-auto">
        <p className="text-sm text-gray-600 mb-2">
          Home / Search results for: '{query}'
        </p>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Search results for: '{query}'
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {mockData.map((product, idx) => (
            <ProductCard key={idx} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
