import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./layout/Navbar";
import Banner from "./layout/Banner";
import Footer from "./layout/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Product from "./pages/Product";
import OrderSuccess from "./pages/OrderSuccess";

// 🔐 Admin
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import RequireAdmin from "./components/RequireAdmin";

import { useStore } from "./context/StoreContext";
import ScrollToTop from "./components/ScrollToTop";

function AppSplash() {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="flex flex-col items-center gap-3 baggo-fade">
        <div className="h-10 w-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] animate-baggo-spinner" />
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={`${location.pathname}${location.search}`} className="baggo-page-enter">
      <Routes location={location}>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/product/:id" element={<Product />} />

        {/* Admin auth */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Protected admin */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  const { settings, banner, isReady } = useStore();
  const [bannerOpen, setBannerOpen] = useState(Boolean(banner.enabled));

  // keep banner open/closed synced with admin toggle
  useEffect(() => {
    setBannerOpen(Boolean(banner.enabled));
  }, [banner.enabled]);

  // document title
  useEffect(() => {
    if (settings?.siteName) document.title = settings.siteName;
  }, [settings?.siteName]);

  return (
    <BrowserRouter>
      <ScrollToTop />

      {!isReady ? (
        <AppSplash />
      ) : (
        <>
          {/* Banner ABOVE navbar */}
          <Banner
            open={bannerOpen && Boolean(banner.enabled)}
            text={banner.text}
            buttonLabel={banner.buttonLabel}
            buttonHref={banner.buttonHref}
            onClose={() => setBannerOpen(false)}
          />

          <Navbar />

          <AnimatedRoutes />

          <Footer />
        </>
      )}
    </BrowserRouter>
  );
}
