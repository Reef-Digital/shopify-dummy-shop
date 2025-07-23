import React from "react";
import NavBar from "../components/NavBar";
import HeroSection from "../components/HeroSection";
import CategorySection from "../components/CategorySection";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />

      <HeroSection />

      <CategorySection />
    </div>
  );
};

export default Home;
