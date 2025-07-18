import React from "react";

export default function NavBar() {
  return (
    <nav className="bg-neutral-900 text-white shadow flex items-center justify-between px-8 py-4">
      <div className="flex items-center space-x-6 text-lg font-bold">
        {/* Empty for left-align or put social/icon here if needed */}
      </div>
      <div className="flex items-center space-x-8 text-base font-medium">
        <span>New</span>
        <span>Brands</span>
        <span>Deals</span>
        <span>Disposables</span>
        <span>Accessories</span>
        <span>Rewards</span>
        <span>Blog</span>
      </div>
      <div className="flex items-center space-x-6 text-base">
        <span>Sign In</span>
        <span>Cart</span>
        <span>Wish List</span>
      </div>
    </nav>
  );
}