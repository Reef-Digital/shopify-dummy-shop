import React from "react";
import HeroSection from "./components/HeroSection";
import Categories from "./components/Categories";

const Homepage: React.FC = () => {
  return (
    <div>
      <HeroSection />

      <Categories />
    </div>
  );
};

export default Homepage;
