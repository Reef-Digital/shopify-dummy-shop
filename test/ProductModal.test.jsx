import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductModal from "../src/components/ProductModal.jsx";

const mockProduct = {
  productId: "prod-1",
  title: "Classic Longboard",
  brand: "WaveRider",
  description: "A beautiful 9ft longboard for cruising",
  score: 0.92,
  reason: "Matches your preference for classic longboards",
  image: "https://example.com/longboard.jpg",
};

const mockSimilar = [
  { productId: "prod-2", title: "Retro Log", brand: "SurfCo", score: 0.85 },
  { productId: "prod-3", title: "Noserider", brand: "TrimLine", score: 0.78 },
];

describe("ProductModal", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <ProductModal open={false} product={mockProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders product title when open", () => {
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    // Title appears in header and body
    expect(screen.getAllByText("Classic Longboard").length).toBeGreaterThanOrEqual(1);
  });

  it("renders product description", () => {
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    expect(screen.getByText(/beautiful 9ft longboard/i)).toBeInTheDocument();
  });

  it("renders product brand", () => {
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    expect(screen.getByText("WaveRider")).toBeInTheDocument();
  });

  it("renders score as percentage", () => {
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it("renders reason in blue box", () => {
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    expect(screen.getByText(/Matches your preference/i)).toBeInTheDocument();
    expect(screen.getByText("Why this product")).toBeInTheDocument();
  });

  it("renders product image", () => {
    const { container } = render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    const mainImg = container.querySelector('img[src="https://example.com/longboard.jpg"]');
    expect(mainImg).toBeTruthy();
  });

  it("shows placeholder when product has no image", () => {
    const noImgProduct = { ...mockProduct, image: undefined };
    const { container } = render(
      <ProductModal open={true} product={noImgProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    // SVG placeholder icon instead of broken image
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("renders similar products", () => {
    render(
      <ProductModal
        open={true}
        product={mockProduct}
        similar={mockSimilar}
        loading={false}
        onClose={() => {}}
        onSelectSimilar={() => {}}
      />
    );
    expect(screen.getByText("Similar products")).toBeInTheDocument();
    expect(screen.getByText("Retro Log")).toBeInTheDocument();
    expect(screen.getByText("Noserider")).toBeInTheDocument();
  });

  it("shows loading state for similar products", () => {
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={true} onClose={() => {}} />
    );
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it("shows error for similar products", () => {
    render(
      <ProductModal
        open={true}
        product={mockProduct}
        similar={[]}
        loading={false}
        error="Network error"
        onClose={() => {}}
      />
    );
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows empty state when no similar products", () => {
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={() => {}} />
    );
    expect(screen.getByText("No similar products found.")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={onClose} />
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key pressed", () => {
    const onClose = vi.fn();
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={onClose} />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn();
    render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={onClose} />
    );
    const backdrop = screen.getByTestId("dummyshop-product-modal");
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when modal content clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ProductModal open={true} product={mockProduct} similar={[]} loading={false} onClose={onClose} />
    );
    // Click on the inner modal card (not the backdrop)
    const modalCard = container.querySelector("[class*='max-w-5xl']");
    fireEvent.mouseDown(modalCard);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onSelectSimilar when similar product clicked", () => {
    const onSelectSimilar = vi.fn();
    render(
      <ProductModal
        open={true}
        product={mockProduct}
        similar={mockSimilar}
        loading={false}
        onClose={() => {}}
        onSelectSimilar={onSelectSimilar}
      />
    );
    fireEvent.click(screen.getByText("Retro Log").closest("button"));
    expect(onSelectSimilar).toHaveBeenCalledWith(mockSimilar[0]);
  });

  it("limits similar products to 10", () => {
    const manySimilar = Array.from({ length: 15 }, (_, i) => ({
      productId: `prod-${i}`,
      title: `Product ${i}`,
      brand: "Brand",
      score: 0.5,
    }));
    render(
      <ProductModal
        open={true}
        product={mockProduct}
        similar={manySimilar}
        loading={false}
        onClose={() => {}}
        onSelectSimilar={() => {}}
      />
    );
    // Should only render first 10
    expect(screen.getByText("Product 9")).toBeInTheDocument();
    expect(screen.queryByText("Product 10")).not.toBeInTheDocument();
  });
});
