import { useMemo } from "react";
import { useFavorites } from "../context/FavoritesContext";
import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";
import Container from "../layout/Container";

export default function Favorites() {
  const { favoriteIds } = useFavorites();
  const { products } = useStore();

  const favorites = useMemo(() => {
    const set = new Set(favoriteIds.map(String));
    return products.filter((p) => set.has(String(p.id)));
  }, [favoriteIds, products]);

  if (favorites.length === 0) {
    return (
      <Container>
        <div className="py-16">
          <h1 className="mb-4 text-3xl font-semibold text-[var(--color-text)]">
            Favorites
          </h1>
          <p className="text-[var(--color-text-muted)]">No favorites yet.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-16">
        <h1 className="mb-12 text-3xl font-semibold text-[var(--color-text)]">Favorites</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {favorites.map((product, idx) => (
            <div key={product.id} className="baggo-reveal" style={{ "--baggo-delay": `${Math.min(idx, 12) * 35}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
