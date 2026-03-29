import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NavBar from "../src/components/NavBar.jsx";

describe("NavBar", () => {
  it("renders the shop name", () => {
    render(<NavBar />);
    // Default shop name from config
    expect(screen.getByText(/Longboard Dummy Shop/i)).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<NavBar />);
    expect(screen.getByText("New Arrivals")).toBeInTheDocument();
    expect(screen.getByText("Brands")).toBeInTheDocument();
    expect(screen.getByText("Deals")).toBeInTheDocument();
    expect(screen.getByText("Accessories")).toBeInTheDocument();
  });

  it("renders sign in link", () => {
    render(<NavBar />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("has fixed positioning", () => {
    const { container } = render(<NavBar />);
    const nav = container.querySelector("nav");
    expect(nav.className).toContain("fixed");
    expect(nav.className).toContain("z-50");
  });

  it("shop name links to homepage", () => {
    render(<NavBar />);
    const link = screen.getByText(/Longboard Dummy Shop/i).closest("a");
    expect(link).toHaveAttribute("href", expect.stringContaining("inops.io"));
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
