import React from "react";
import SearchBar from "./SearchBar";

export default function Body() {
  return (
    <div className="flex-1 flex flex-col items-center bg-gradient-to-r from-blue-100 to-blue-50 py-8">
      {/* --- Hero Banner --- */}
      <div className="w-full flex justify-center mb-8">
        <img
          src="https://placehold.co/900x220?text=Big+Hero+Promo+Banner"
          alt="Promo Banner"
          className="rounded-lg shadow"
          style={{ maxWidth: 900, width: "100%" }}
        />
      </div>
      {/* --- SearchBar --- */}
      <div className="w-full flex justify-center mt-2 mb-10">
        <SearchBar />
      </div>
      {/* --- Categories --- */}
      <div className="flex space-x-8 mt-4">
  {/* Boards */}
  <div className="bg-white rounded-lg shadow p-6 text-center w-60">
    <img
      src="https://placehold.co/128x128?text=Boards"
      alt="Boards"
      className="mx-auto mb-3 rounded"
    />
    <div className="text-2xl mb-2 font-semibold">Boards</div>
    <div className="text-gray-400 text-sm">NEW</div>
  </div>
  {/* Fins */}
  <div className="bg-white rounded-lg shadow p-6 text-center w-60">
    <img
      src="https://placehold.co/128x128?text=Fins"
      alt="Fins"
      className="mx-auto mb-3 rounded"
    />
    <div className="text-2xl mb-2 font-semibold">Fins</div>
    <div className="text-gray-400 text-sm">NEW</div>
  </div>
  {/* Leashes */}
  <div className="bg-white rounded-lg shadow p-6 text-center w-60">
    <img
      src="https://placehold.co/128x128?text=Leashes"
      alt="Leashes"
      className="mx-auto mb-3 rounded"
    />
    <div className="text-2xl mb-2 font-semibold">Leashes</div>
    <div className="text-gray-400 text-sm">NEW</div>
  </div>
</div>
    </div>
  );
}