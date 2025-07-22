import React from "react";

import Body from "./components/Body";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";


export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />
      <Body />
      <Footer />
    </div>
  );
}