import { createContext, useContext, useState, useEffect } from "react";
import { getMaxStockFor } from "../lib/stock";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(product) {
    setCart((prev) => {
      const vIdx = product?.variantIndex ?? null;
      const imgKey = String(product?.image || "");
      const existing = prev.find(
        (p) =>
          p.id === product.id &&
          p.size === product.size &&
          (p.variantIndex ?? null) === vIdx &&
          String(p?.image || "") === imgKey
      );

      const max = getMaxStockFor(product, product.size, vIdx);

      if (existing) {
        if (existing.quantity >= max) return prev;

        return prev.map((p) =>
          p.id === product.id &&
          p.size === product.size &&
          (p.variantIndex ?? null) === vIdx &&
          String(p?.image || "") === imgKey
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [...prev, { ...product, variantIndex: vIdx, quantity: 1 }];
    });
  }

  function removeFromCart(id, size, variantIndex = null, image = "") {
    const imgKey = String(image || "");
    setCart((prev) =>
      prev.filter(
        (p) =>
          !(
            p.id === id &&
            p.size === size &&
            (p.variantIndex ?? null) === (variantIndex ?? null) &&
            (imgKey ? String(p?.image || "") === imgKey : true)
          )
      )
    );
  }

  function updateQuantity(id, size, amount, variantIndex = null, image = "") {
    const imgKey = String(image || "");
    setCart((prev) =>
      prev.map((p) =>
        p.id === id &&
        p.size === size &&
        (p.variantIndex ?? null) === (variantIndex ?? null) &&
        (imgKey ? String(p?.image || "") === imgKey : true)
          ? {
              ...p,
              quantity: Math.max(
                1,
                Math.min(amount, getMaxStockFor(p, p.size, p.variantIndex ?? null))
              ),
            }
          : p
      )
    );
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
