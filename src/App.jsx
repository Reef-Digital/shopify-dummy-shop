<<<<<<< Updated upstream
import "./App.css";
import NavBar from "./components/NavBar";
import Homepage from "./pages/Homepage";

function App() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <Homepage />
=======
import React from "react";

import Body from "./components/Body";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Body />
      <Footer />
>>>>>>> Stashed changes
    </div>
  );
}

export default App;
