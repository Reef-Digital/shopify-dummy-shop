import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../src/App.jsx";

// Mock fetch for Body component
global.fetch = vi.fn();

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it("renders NavBar", () => {
    render(<App />);
    const nav = document.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  it("renders Footer", () => {
    render(<App />);
    const footer = document.querySelector("footer");
    expect(footer).toBeInTheDocument();
  });

  it("renders all major sections", () => {
    render(<App />);
    // Hero (appears in NavBar, Hero, and Footer)
    expect(screen.getAllByText(/Longboard Dummy Shop/i).length).toBeGreaterThanOrEqual(1);
    // Search
    expect(screen.getByText("Search Products")).toBeInTheDocument();
    // Inventory
    expect(screen.getByText("Shop Inventory")).toBeInTheDocument();
    // Footer
    expect(screen.getByText(/Reef Digital/i)).toBeInTheDocument();
  });

  it("has correct root layout classes", () => {
    const { container } = render(<App />);
    const root = container.firstChild;
    expect(root.className).toContain("min-h-screen");
    expect(root.className).toContain("flex");
    expect(root.className).toContain("flex-col");
  });
});
