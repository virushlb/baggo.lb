// Pricing helpers
// Schema-safe approach:
// - base price: product.price
// - optional discount price can live either in:
//   1) product.discount_price (if a column exists)
//   2) product.stock.__discount_price (used by Admin here)

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function getDiscountPrice(product) {
  const p = product || {};
  const direct = toNum(p.discount_price);
  if (direct !== null) return direct;
  const st = p.stock && typeof p.stock === "object" ? p.stock : {};
  const fromStock = toNum(st.__discount_price);
  return fromStock;
}

export function getBasePrice(product) {
  const p = product || {};
  const n = Number(p.price || 0);
  return Number.isFinite(n) ? n : 0;
}

export function getUnitPrice(product) {
  const base = getBasePrice(product);
  const disc = getDiscountPrice(product);
  if (disc === null) return base;
  if (!Number.isFinite(disc)) return base;
  // Only treat as a real discount if it's positive and lower than base.
  if (disc > 0 && disc < base) return disc;
  return base;
}

export function hasDiscount(product) {
  const base = getBasePrice(product);
  const disc = getDiscountPrice(product);
  return disc !== null && Number.isFinite(disc) && disc > 0 && disc < base;
}
