import React from "react";
import NavBar from "../components/NavBar";
import HeroSection from "../components/HeroSection";
import CategorySection from "../components/CategorySection";
import SearchBar from "../components/SearchBar";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />

      <SearchBar />

      <CategorySection />
    </div>
  );
};

export default Home;
