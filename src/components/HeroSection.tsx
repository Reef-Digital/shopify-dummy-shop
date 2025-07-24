import React from "react";
import heroImg from "../assets/images/boardshop.webp";

const HeroSection: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center mt-6">
      <div
        className="relative w-[90%] h-[40vh] bg-cover bg-center rounded-xl shadow-md"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="absolute bottom-4 left-4 text-white max-w-md">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold drop-shadow">
            Shopify Dummy Shop
          </h1>
          <p className="text-sm sm:text-base md:text-lg mt-2 drop-shadow">
            An unbeatable range of premium surfboards from high performance
            short boards to grovelers and all the other essentials you need
            #RideWithUs
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSection);
