import React from "react";
import { INOPS_CONFIG } from "../config/api";

export default function NavBar() {
  const homepageUrl = INOPS_CONFIG.homepageUrl;
  const shopName = INOPS_CONFIG.shopName;
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F3253] text-white shadow-lg">
      <div className="max-w-[1080px] mx-auto flex items-center justify-between px-6 py-3">
        <a
          href={homepageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl font-bold tracking-tight hover:opacity-90 transition"
        >
          {shopName}
        </a>
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {["New Arrivals", "Brands", "Deals", "Accessories"].map((t) => (
            <span key={t} className="hover:text-[#6BD7FF] transition cursor-default">
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className="hover:text-[#6BD7FF] transition cursor-default">Sign In</span>
          <span className="hover:text-[#6BD7FF] transition cursor-default">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </span>
        </div>
      </div>
    </nav>
  );
}
