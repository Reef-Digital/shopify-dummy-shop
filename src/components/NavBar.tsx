import React, { useState } from "react";
import IconUser from "../assets/icons/icon_user.svg";
import IconCart from "../assets/icons/icon_cart.svg";
import SearchBar from "./SearchBar";
import { useNavigate } from "react-router-dom";

const navLinks = [
  "Brands",
  "New",
  "Surfboards",
  "Surf Accessories",
  "Wetsuits",
  "Bodyboard",
  "Custom Board Builder",
  "Bestsellers",
  "Gift Vouchers",
  "Sale",
];

const NavBar: React.FC = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const goToHome = () => {
    navigate("/shopify-dummy-shop");
  };

  return (
    <div className="w-full bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={goToHome}
        >
          <div className="font-bold text-lg tracking-wider">🟫🟫🟫</div>
          <span className="font-semibold text-xl">DUMMY SHOPIFY</span>
        </div>

        <div className="hidden md:block flex-grow mx-6 max-w-md">
          <SearchBar />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:inline">USD ($)</span>
          <button aria-label="Account">
            <img src={IconUser} alt="User" className="w-6 h-6" />
          </button>
          <button aria-label="Cart">
            <img src={IconCart} alt="User" className="w-6 h-6" />
          </button>

          <button
            className="md:hidden text-2xl font-bold"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      <div className="hidden md:flex border-t">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap gap-8 text-sm font-bold">
          {navLinks.map((item) => (
            <button key={item} className="hover:underline">
              {item}
            </button>
          ))}
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-2">
          <div className="flex flex-col space-y-2 text-sm font-medium">
            {navLinks.map((item) => (
              <button key={item} className="text-left hover:underline">
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(NavBar);
