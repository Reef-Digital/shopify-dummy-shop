import React from "react";

export default function Logo({ large }) {
  return (
    <div className={`flex items-center justify-center ${large ? 'mb-2' : ''}`}>
      <img
        src="https://placehold.co/80x80?text=Logo"
        alt="Logo"
        className={`rounded ${large ? 'w-20 h-20' : 'w-10 h-10'}`}
      />
      <span className={`font-bold text-blue-600 tracking-tight ${large ? 'text-4xl ml-4' : 'text-2xl ml-2'}`}>
        Longboard&apos;s Puerto de la Cruz
      </span>
    </div>
  );
}