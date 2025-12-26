import { useEffect, useMemo, useState } from "react";

export default function SafeImage({ src, alt = "", className = "", style }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    // When the src changes, give it another chance.
    setBroken(false);
  }, [src]);

  const placeholder = useMemo(() => {
    // Works on GitHub Pages + nested routes
    return `${import.meta.env.BASE_URL}placeholder.svg`;
  }, []);

  const normalizedSrc = useMemo(() => {
    const raw = String(src || "").trim();
    if (!raw) return "";

    // External or special schemes should pass through.
    const lower = raw.toLowerCase();
    if (
      lower.startsWith("http://") ||
      lower.startsWith("https://") ||
      lower.startsWith("data:") ||
      lower.startsWith("blob:") ||
      lower.startsWith("tel:") ||
      lower.startsWith("mailto:") ||
      raw.startsWith("//")
    ) {
      return raw;
    }

    // Local paths: always anchor to Vite base URL so they work in nested routes + GitHub Pages.
    const base = String(import.meta.env.BASE_URL || "/");
    const cleaned = raw.replace(/^\//, "");
    return `${base}${cleaned}`;
  }, [src]);

  const finalSrc = !normalizedSrc || broken ? placeholder : normalizedSrc;

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
