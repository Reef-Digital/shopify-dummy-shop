import { describe, it, expect } from "vitest";

// We test the helper logic extracted from Body.jsx
// Since helpers are module-scoped, we replicate them here for unit testing.
// In a future refactor these should be in a shared utils file.

const title = (p) => String(p?.title || p?.name || p?.productId || p?.id || "").trim() || "Product";
const brand = (p) => String(p?.brand || p?.vendor || "").trim();
const category = (p) => String(p?.category || p?.metadata?.category || "").trim();
const description = (p) => String(p?.description || "").trim();
const reason = (p) => String(p?.reason || "").trim();

const img = (p) => {
  const raw =
    p?.image || p?.imageUrl || p?.metadata?.imageUrl ||
    (Array.isArray(p?.imagePaths) ? p.imagePaths[0] : null) ||
    (Array.isArray(p?.images) ? p.images[0] : null) ||
    null;
  return raw ? String(raw).trim() : "";
};

const score = (p) => {
  const s = p?.score ?? p?.relevance ?? null;
  if (typeof s === "number") return (s * 100).toFixed(0) + "%";
  if (typeof s === "string") {
    const n = parseFloat(s);
    if (Number.isFinite(n)) return (n > 1 ? n : n * 100).toFixed(0) + "%";
  }
  return "";
};

describe("title()", () => {
  it("returns title field", () => {
    expect(title({ title: "Longboard Pro" })).toBe("Longboard Pro");
  });
  it("falls back to name", () => {
    expect(title({ name: "Surfboard" })).toBe("Surfboard");
  });
  it("falls back to productId", () => {
    expect(title({ productId: "abc-123" })).toBe("abc-123");
  });
  it("falls back to id", () => {
    expect(title({ id: "xyz" })).toBe("xyz");
  });
  it("returns 'Product' for empty/null", () => {
    expect(title(null)).toBe("Product");
    expect(title({})).toBe("Product");
    expect(title(undefined)).toBe("Product");
  });
  it("trims whitespace", () => {
    expect(title({ title: "  Padded  " })).toBe("Padded");
  });
});

describe("brand()", () => {
  it("returns brand field", () => {
    expect(brand({ brand: "WaveRider" })).toBe("WaveRider");
  });
  it("falls back to vendor", () => {
    expect(brand({ vendor: "ShopVendor" })).toBe("ShopVendor");
  });
  it("returns empty string for missing", () => {
    expect(brand({})).toBe("");
    expect(brand(null)).toBe("");
  });
});

describe("category()", () => {
  it("returns category field", () => {
    expect(category({ category: "Longboards" })).toBe("Longboards");
  });
  it("falls back to metadata.category", () => {
    expect(category({ metadata: { category: "Fins" } })).toBe("Fins");
  });
  it("returns empty string for missing", () => {
    expect(category({})).toBe("");
  });
});

describe("description()", () => {
  it("returns description field", () => {
    expect(description({ description: "A great board" })).toBe("A great board");
  });
  it("returns empty string for missing", () => {
    expect(description({})).toBe("");
  });
});

describe("reason()", () => {
  it("returns reason field", () => {
    expect(reason({ reason: "Best match for intent" })).toBe("Best match for intent");
  });
  it("returns empty string for missing", () => {
    expect(reason(null)).toBe("");
  });
});

describe("img()", () => {
  it("returns image field", () => {
    expect(img({ image: "https://cdn.example.com/a.jpg" })).toBe("https://cdn.example.com/a.jpg");
  });
  it("falls back to imageUrl", () => {
    expect(img({ imageUrl: "https://cdn.example.com/b.jpg" })).toBe("https://cdn.example.com/b.jpg");
  });
  it("falls back to metadata.imageUrl", () => {
    expect(img({ metadata: { imageUrl: "https://cdn.example.com/c.jpg" } })).toBe("https://cdn.example.com/c.jpg");
  });
  it("falls back to imagePaths[0]", () => {
    expect(img({ imagePaths: ["https://cdn.example.com/d.jpg"] })).toBe("https://cdn.example.com/d.jpg");
  });
  it("falls back to images[0]", () => {
    expect(img({ images: ["https://cdn.example.com/e.jpg"] })).toBe("https://cdn.example.com/e.jpg");
  });
  it("returns empty string for missing", () => {
    expect(img({})).toBe("");
    expect(img(null)).toBe("");
  });
  it("ignores empty arrays", () => {
    expect(img({ imagePaths: [], images: [] })).toBe("");
  });
  it("trims whitespace", () => {
    expect(img({ image: "  https://cdn.example.com/f.jpg  " })).toBe("https://cdn.example.com/f.jpg");
  });
});

describe("score()", () => {
  it("converts 0-1 number to percentage", () => {
    expect(score({ score: 0.85 })).toBe("85%");
    expect(score({ score: 0.271 })).toBe("27%");
    expect(score({ score: 1 })).toBe("100%");
    expect(score({ score: 0 })).toBe("0%");
  });
  it("uses relevance as fallback", () => {
    expect(score({ relevance: 0.5 })).toBe("50%");
  });
  it("handles string scores (0-1 range)", () => {
    expect(score({ score: "0.75" })).toBe("75%");
  });
  it("handles string scores (>1 treated as raw percentage)", () => {
    expect(score({ score: "85" })).toBe("85%");
  });
  it("returns empty string for missing", () => {
    expect(score({})).toBe("");
    expect(score(null)).toBe("");
  });
  it("returns empty string for non-numeric string", () => {
    expect(score({ score: "high" })).toBe("");
  });
});
