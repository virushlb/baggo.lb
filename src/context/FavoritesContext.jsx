import { createContext, useContext, useEffect, useState } from "react";

const FavoritesContext = createContext(null);
const KEY = "BAGGO_FAV_V1";

function readFavs() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(() => {
    if (typeof window === "undefined") return [];
    return readFavs();
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(favoriteIds));
    } catch {
      // ignore
    }
  }, [favoriteIds]);

  function toggleFavorite(productOrId) {
    const id = String(productOrId?.id ?? productOrId);
    if (!id) return;

    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function isFavorite(id) {
    return favoriteIds.includes(String(id));
  }

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}
