import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Ensures each route starts at the top (prevents retained scroll / jumpiness).
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  // Some browsers attempt to restore scroll position on SPA navigation.
  // Force manual so our scrollTo always wins.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Wait for the next paint so route transitions/layout won't override.
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [pathname, search]);

  return null;
}
