import React from "react";
import logo from "../assets/icons/logo.svg";

const NavBar: React.FC = () => {
  return (
    <div className="px-36">
      <div className="flex flex-row items-center justify-between py-4 border-b border-b-[#E5E7EB]">
        <div className="flex flex-row items-center gap-2">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <div className="text-2xl font-bold">InOps</div>
        </div>

        <div className="flex flex-row items-center gap-2">
          <div>Cart</div>
          <div>Account</div>
        </div>
      </div>

      <div className="flex flex-row items-center justify-center py-3 gap-8">
        <div className="text-lg">Home</div>
        <div className="text-lg">Best Sellers</div>
        <div className="text-lg">Catalog</div>
        <div className="text-lg">Contact</div>
      </div>
    </div>
  );
};

export default React.memo(NavBar);
