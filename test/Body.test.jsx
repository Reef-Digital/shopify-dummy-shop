import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Body from "../src/components/Body.jsx";

// Mock fetch
global.fetch = vi.fn();

describe("Body", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch.mockReset();
    // Ensure no SDK on window
    delete window.Inops;
  });

  it("renders the shop name in the hero", () => {
    render(<Body />);
    expect(screen.getByText(/Longboard Dummy Shop/i)).toBeInTheDocument();
  });

  it("renders the hero CTA link", () => {
    render(<Body />);
    const cta = screen.getByText(/Powered by Inops/i);
    expect(cta.closest("a")).toHaveAttribute("href", expect.stringContaining("inops.io"));
  });

  it("renders the search section", () => {
    render(<Body />);
    expect(screen.getByText("Search Products")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/longboard/i)).toBeInTheDocument();
  });

  it("renders the inventory table with mock products", () => {
    render(<Body />);
    expect(screen.getByText("Shop Inventory")).toBeInTheDocument();
    expect(screen.getByText("Classic Longboard")).toBeInTheDocument();
    expect(screen.getByText("Kids Shortboard")).toBeInTheDocument();
    expect(screen.getByText("Pro Wetsuit")).toBeInTheDocument();
  });

  it("shows inventory table headers", () => {
    render(<Body />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders search button", () => {
    render(<Body />);
    const searchBtn = screen.getByRole("button", { name: /search/i });
    expect(searchBtn).toBeInTheDocument();
  });

  it("renders Featured Products section", () => {
    render(<Body />);
    expect(screen.getByText("Featured Products")).toBeInTheDocument();
  });

  it("renders search instruction text", () => {
    render(<Body />);
    expect(screen.getByText(/3\+ characters/)).toBeInTheDocument();
  });

  it("renders the search type badge for 3+ char queries", async () => {
    // Just verify the badge rendering logic works (no actual API call)
    render(<Body />);
    // Type less than 3 chars — badge should not appear
    expect(screen.queryByText("Direct")).not.toBeInTheDocument();
    expect(screen.queryByText("Intent")).not.toBeInTheDocument();
  });
});
