import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "../src/components/Footer.jsx";

describe("Footer", () => {
  it("renders shop name", () => {
    render(<Footer />);
    expect(screen.getByText(/Longboard Dummy Shop/i)).toBeInTheDocument();
  });

  it("renders current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("links to Inops homepage", () => {
    render(<Footer />);
    const link = screen.getByText("Inops");
    expect(link.closest("a")).toHaveAttribute("href", expect.stringContaining("inops.io"));
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("mentions Reef Digital", () => {
    render(<Footer />);
    expect(screen.getByText(/Reef Digital/i)).toBeInTheDocument();
  });
});
