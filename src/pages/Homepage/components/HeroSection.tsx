import React from "react";
import bgImage from "../../../assets/images/background.png";
import SearchInput from "../../../components/SearchInput";

const HeroSection: React.FC = () => {

  return (
    <div
      className="h-[700px] bg-cover bg-center pt-24"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)`,
        }}
      ></div>
      <div className="relative px-20">
        <div className="flex flex-col items-center">
          <h1 className="text-6xl font-extrabold text-[#1D4C73] mt-6 text-center">
            Shopify Dummy Shop
          </h1>

          <p className="text-xl font-normal my-6 text-[#1B5A8E] text-center">
            Try our AI powered search — faster, smarter, and spot-on every time!
          </p>

          <SearchInput 
            placeholder="Search"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSection);
