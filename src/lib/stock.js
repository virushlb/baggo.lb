// Stock helpers
// Supports two formats:
// 1) Legacy (per-size): { "S": 4, "M": 0 }
// 2) Per-image variants (stored inside stock jsonb):
//    {
//      "__mode": "per_image",
//      "variants": [
//        { "name": "...", "description": "...", "stock": { "S": 2, "M": 1 } },
//        { "name": "...", "description": "...", "stock": { "S": 0, "M": 3 } }
//      ]
//    }

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function isPerImageStock(stock) {
  return Boolean(stock && typeof stock === "object" && stock.__mode === "per_image" && Array.isArray(stock.variants));
}

export function getVariantStockMap(product, variantIndex) {
  const stock = product?.stock;
  if (!isPerImageStock(stock)) return stock && typeof stock === "object" ? stock : {};
  const idx = Number(variantIndex ?? 0);
  const v = stock.variants?.[idx];
  return v && typeof v === "object" && v.stock && typeof v.stock === "object" ? v.stock : {};
}

export function getMaxStockFor(product, size, variantIndex) {
  if (!product) return 0;
  const s = String(size || "").trim();
  if (!s) return 0;

  const stock = product.stock;
  if (!isPerImageStock(stock)) {
    return toInt(stock?.[s]);
  }

  const idx = Number(variantIndex ?? 0);
  const v = stock.variants?.[idx];
  return toInt(v?.stock?.[s]);
}

export function getTotalStockForSize(product, size) {
  if (!product) return 0;
  const s = String(size || "").trim();
  if (!s) return 0;

  const stock = product.stock;
  if (!isPerImageStock(stock)) return toInt(stock?.[s]);

  return toInt(
    (stock.variants || []).reduce((sum, v) => sum + toInt(v?.stock?.[s]), 0)
  );
}

export function hasAnyStock(product) {
  if (!product) return false;
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  if (!sizes.length) return true; // no sizes => treat as available
  return sizes.some((s) => getTotalStockForSize(product, s) > 0);
}

/**
 * Pick a quick-add target.
 * - Legacy: first size with stock.
 * - Per-image: first (variant,size) pair with stock.
 */
export function pickFirstInStock(product) {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const images = Array.isArray(product?.images) ? product.images : [];
  const stock = product?.stock;

  if (!sizes.length) {
    return { size: null, variantIndex: null, image: images[0] || product?.image || "" };
  }

  if (isPerImageStock(stock)) {
    const variants = Array.isArray(stock.variants) ? stock.variants : [];
    for (const s of sizes) {
      for (let vi = 0; vi < variants.length; vi++) {
        if (toInt(variants[vi]?.stock?.[s]) > 0) {
          return {
            size: s,
            variantIndex: vi,
            image: images[vi] || images[0] || product?.image || "",
          };
        }
      }
    }
    // fallback: first size + variant 0
    return {
      size: sizes[0],
      variantIndex: 0,
      image: images[0] || product?.image || "",
    };
  }

  const legacy = stock && typeof stock === "object" ? stock : {};
  for (const s of sizes) {
    if (toInt(legacy?.[s]) > 0) {
      return { size: s, variantIndex: null, image: images[0] || product?.image || "" };
    }
  }
  return { size: sizes[0] || null, variantIndex: null, image: images[0] || product?.image || "" };
}

// Total stock across all variants + sizes (used for low-stock badges/admin)
export function getTotalStock(product) {
  if (!product) return 0;
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  if (!sizes.length) return 0;
  return sizes.reduce((sum, s) => sum + getTotalStockForSize(product, s), 0);
}

/**
 * List stock entries for admin/inventory.
 * Returns rows like:
 * { size, qty, variantIndex, variantName, image }
 */
export function listStockEntries(product) {
  if (!product) return [];
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const images = Array.isArray(product.images) ? product.images : [];
  const stock = product.stock;

  if (!sizes.length) return [];

  // Per-image variants
  if (isPerImageStock(stock)) {
    const variants = Array.isArray(stock.variants) ? stock.variants : [];
    const rows = [];
    for (let vi = 0; vi < variants.length; vi++) {
      const v = variants[vi] || {};
      const variantName = String(v.name || "").trim() || `Variant ${vi + 1}`;
      for (const s of sizes) {
        rows.push({
          size: s,
          qty: toInt(v?.stock?.[s]),
          variantIndex: vi,
          variantName,
          image: images[vi] || images[0] || product.image || "",
        });
      }
    }
    return rows;
  }

  // Legacy per-size
  const legacy = stock && typeof stock === "object" ? stock : {};
  return sizes.map((s) => ({
    size: s,
    qty: toInt(legacy?.[s]),
    variantIndex: null,
    variantName: null,
    image: images[0] || product.image || "",
  }));
}
