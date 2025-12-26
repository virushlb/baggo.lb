import { Link } from "react-router-dom";

// Site-wide banner (text + optional button).
// Driven by Store settings (Normal Admin).

export default function Banner({
  open = true,
  text = "",
  buttonLabel = "",
  buttonHref = "",
  onClose,
}) {
  if (!open) return null;

  const hasBtn = Boolean(buttonLabel) && Boolean(buttonHref);
  const isInternal = hasBtn && String(buttonHref).trim().startsWith("/");

  const Btn = () => {
    if (!hasBtn) return null;
    const cls =
      "ml-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold border border-[var(--color-banner-border)] bg-white/70 backdrop-blur hover:bg-white/85 transition";

    if (isInternal) {
      return (
        <Link to={buttonHref} className={cls}>
          {buttonLabel}
        </Link>
      );
    }

    return (
      <a href={buttonHref} className={cls} target="_blank" rel="noreferrer">
        {buttonLabel}
      </a>
    );
  };

  return (
    <div
      className="baggo-banner-enter w-full h-11 border-b flex items-center"
      style={{
        backgroundColor: "var(--color-banner-bg)",
        borderColor: "var(--color-banner-border)",
      }}
    >
      <div className="max-w-7xl mx-auto w-full px-6 relative flex items-center justify-center">
        <div className="flex items-center justify-center gap-0">
          <p className="text-sm text-center" style={{ color: "var(--color-banner-text)" }}>
            {text}
          </p>
          <Btn />
        </div>

        {typeof onClose === "function" ? (
          <button
            onClick={onClose}
            className="absolute right-4 text-sm opacity-80 hover:opacity-100 transition"
            style={{ color: "var(--color-banner-text)" }}
            aria-label="Close banner"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
