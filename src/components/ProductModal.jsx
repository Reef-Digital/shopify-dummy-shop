import React, { useEffect } from "react";

function title(p) {
  return String(p?.title || p?.name || p?.productId || p?.id || "").trim() || "Product";
}
function brand(p) {
  return String(p?.brand || p?.vendor || "").trim();
}
function desc(p) {
  return String(p?.description || "").trim();
}
function reason(p) {
  return String(p?.reason || "").trim();
}
function img(p) {
  const raw =
    p?.image ||
    p?.imageUrl ||
    p?.metadata?.imageUrl ||
    (p?.metadata && typeof p.metadata === 'object' ? p.metadata.imageUrl : null) ||
    (Array.isArray(p?.imagePaths) ? p.imagePaths[0] : null) ||
    (Array.isArray(p?.images) ? p.images[0] : null) ||
    null;
  const imgUrl = raw ? String(raw).trim() : "";
  // Debug: log if image URL is found
  if (imgUrl && typeof window !== 'undefined') {
    console.log('[ProductModal] Image URL found:', { 
      productId: p?.productId || p?.id, 
      title: p?.title || p?.name,
      imgUrl,
      source: p?.image ? 'image' : p?.imageUrl ? 'imageUrl' : p?.metadata?.imageUrl ? 'metadata.imageUrl' : 'other'
    });
  }
  return imgUrl;
}
function score(p) {
  const s = p?.score ?? p?.relevance ?? null;
  if (typeof s === 'number') {
    // Convert to percentage (0-1 range to 0-100)
    const percent = s * 100;
    return percent.toFixed(0) + '%';
  }
  if (typeof s === 'string') {
    const n = parseFloat(s);
    if (Number.isFinite(n)) {
      // If already > 1, assume it's already a percentage, otherwise convert
      const percent = n > 1 ? n : n * 100;
      return percent.toFixed(0) + '%';
    }
  }
  return '';
}

export default function ProductModal({
  open,
  homepageUrl,
  product,
  similar,
  loading,
  error,
  onClose,
  onSelectSimilar,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const mainImg = img(product);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      data-testid="dummyshop-product-modal"
    >
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold text-gray-900 truncate">{title(product)}</div>
          <button
            type="button"
            className="h-9 w-9 rounded-full hover:bg-gray-100 text-gray-600"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Selected product */}
          <div className="p-5 md:border-r border-gray-200">
            <div className="aspect-[4/3] rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
              {mainImg ? (
                <img 
                  src={mainImg} 
                  alt={title(product)} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/400x300/E5E7EB/6B7280?text=${encodeURIComponent(title(product).substring(0, 15))}`;
                  }}
                />
              ) : (
                <div className="text-sm text-gray-400">No image</div>
              )}
            </div>

            <div className="mt-4">
              <div className="text-xl font-extrabold text-gray-900">
                {title(product)}
                {score(product) ? <span className="text-gray-500 ml-2 text-lg">({score(product)})</span> : null}
              </div>
              {brand(product) ? (
                <div className="text-sm text-gray-500 mt-1">{brand(product)}</div>
              ) : null}
              {desc(product) ? (
                <div className="text-sm text-gray-600 mt-3 leading-6">{desc(product)}</div>
              ) : null}
              {reason(product) ? (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Why this product</div>
                  <div className="text-sm text-blue-800 leading-6">{reason(product)}</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Similar */}
          <div className="p-5">
            <div className="font-semibold text-gray-900 mb-3">Similar products</div>

            {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}
            {!loading && error ? <div className="text-sm text-red-600">{error}</div> : null}
            {!loading && !error && (!similar || !similar.length) ? (
              <div className="text-sm text-gray-500">No similar products found.</div>
            ) : null}

            <div className="space-y-2">
              {(similar || []).slice(0, 10).map((p) => (
                <button
                  key={String(p?.productId || p?.id || p?.title || "")}
                  type="button"
                  className="w-full text-left rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition px-3 py-3"
                  onClick={() => onSelectSimilar?.(p)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center">
                      {img(p) ? (
                        <img 
                          src={img(p)} 
                          alt={title(p)} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://placehold.co/56x56/E5E7EB/6B7280?text=${encodeURIComponent(title(p).substring(0, 8))}`;
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {title(p)}
                        {score(p) ? <span className="text-gray-500 ml-1">({score(p)})</span> : null}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{brand(p)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

