import React from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/shopify-dummy-shop" element={<Home />} />
        <Route path="/shopify-dummy-shop/search" element={<SearchResults />} />
      </Routes>
    </Router>
  );
}
