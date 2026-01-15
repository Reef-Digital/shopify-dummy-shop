import React from "react";
import { INOPS_CONFIG } from "../config/api";

export default function NavBar() {
  const homepageUrl = INOPS_CONFIG.homepageUrl;
  const shopName = INOPS_CONFIG.shopName;
  return (
    <nav className="bg-neutral-900 text-white shadow flex items-center justify-between px-8 py-4">
      <div className="flex items-center space-x-3 text-lg font-bold">
        <a href={homepageUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition">
          {shopName}
        </a>
      </div>
      <div className="flex items-center space-x-8 text-base font-medium">
        {["New", "Brands", "Deals", "Accessories", "Blog"].map((t) => (
          <a key={t} href={homepageUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition">
            {t}
          </a>
        ))}
      </div>
      <div className="flex items-center space-x-6 text-base">
        {["Sign In", "Cart", "Wish List"].map((t) => (
          <a key={t} href={homepageUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition">
            {t}
          </a>
        ))}
      </div>
    </nav>
    
  );
}