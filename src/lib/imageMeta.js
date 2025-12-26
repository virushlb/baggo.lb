import { isPerImageStock } from "./stock";

// Store image meta without schema changes:
// - images are text[]
// - meta lives inside stock jsonb:
//    legacy: stock.__image_meta = [{name,description}, ...]
//    per-image: stock.variants[i].name / stock.variants[i].description

function clean(s) {
  return String(s || "").trim();
}

export function getImageMeta(product, index) {
  const p = product || {};
  const images = Array.isArray(p.images) ? p.images : p.image ? [p.image] : [];
  const idx = Math.max(0, Math.min(Number(index || 0), Math.max(0, images.length - 1)));

  const stock = p.stock && typeof p.stock === "object" ? p.stock : {};

  // Base defaults
  const baseNameDefault = clean(p.name);
  const baseDescDefault = clean(p.description) || "";

  if (isPerImageStock(stock)) {
    const variants = Array.isArray(stock.variants) ? stock.variants : [];
    const baseV = variants[0] || {};
    const curV = variants[idx] || {};

    const baseName = clean(baseV.name) || baseNameDefault;
    const baseDesc = clean(baseV.description) || baseDescDefault;

    return {
      url: images[idx] || images[0] || "",
      index: idx,
      name: clean(curV.name) || baseName,
      description: clean(curV.description) || baseDesc,
    };
  }

  const metaArr = Array.isArray(stock.__image_meta) ? stock.__image_meta : [];
  const baseM = metaArr[0] || {};
  const curM = metaArr[idx] || {};

  const baseName = clean(baseM.name) || baseNameDefault;
  const baseDesc = clean(baseM.description) || baseDescDefault;

  return {
    url: images[idx] || images[0] || "",
    index: idx,
    name: clean(curM.name) || baseName,
    description: clean(curM.description) || baseDesc,
  };
}

export function getImageIndex(product, url) {
  const p = product || {};
  const images = Array.isArray(p.images) ? p.images : p.image ? [p.image] : [];
  const u = String(url || "");
  const idx = images.indexOf(u);
  return idx >= 0 ? idx : 0;
}
