import React from "react";
import heroImg from "../assets/images/boardshop.webp";

const HeroSection: React.FC = () => {
  return (
    <div
      className="relative w-full h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${heroImg})` }}
    >
      <div className="absolute bottom-10 left-0 w-full px-6 sm:px-10 z-10">
        <div className="text-white max-w-2xl mx-auto md:mx-0 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Huge Surfboard Range
          </h1>
          <p className="mb-6 text-base sm:text-lg md:text-xl">
            An unbeatable range of premium surfboards from high performance
            short boards to grovelers and all the other essentials you need
            #RideWithUs
          </p>
          <button className="bg-white text-black px-6 py-2 rounded hover:bg-gray-100 font-medium">
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSection);
