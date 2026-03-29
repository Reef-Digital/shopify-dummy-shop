import "@testing-library/jest-dom/vitest";

// Stub static asset imports (images, SVGs)
vi.mock("../src/assets/images/background.png", () => ({ default: "test-bg.png" }));
vi.mock("../src/data/products.json", () => ({
  default: [
    { id: "prod-1", title: "Classic Longboard", brand: "WaveRider", category: "Longboards", description: "A classic 9ft longboard" },
    { id: "prod-2", title: "Kids Shortboard", brand: "GromSurf", category: "Shortboards", description: "Small board for kids" },
    { id: "prod-3", title: "Pro Wetsuit", brand: "DeepBlue", category: "Wetsuits", description: "3/2mm fullsuit" },
  ],
}));
