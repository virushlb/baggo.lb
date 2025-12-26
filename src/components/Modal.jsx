import { useEffect } from "react";

/**
 * Simple modal / bottom-sheet.
 * - closes on backdrop click or Escape
 * - renders nothing when closed
 *
 * variant:
 *  - "modal" (default): centered on desktop, bottom-aligned on mobile
 *  - "sheet": true mobile bottom-sheet (slides from bottom). Still centers on desktop.
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  widthClass = "max-w-2xl",
  variant = "modal", // "modal" | "sheet"
}) {
  useEffect(() => {
    if (!open) return;

    // Prevent background scroll while the modal is open (especially on mobile)
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isSheet = variant === "sheet";

  return (
    <div
      className={
        "fixed inset-0 z-[1000] flex justify-center " +
        (isSheet ? "p-0 sm:p-4 " : "p-3 sm:p-4 ") +
        // Mobile: always bottom aligned. Desktop: modal centers, sheet can still center.
        (isSheet ? "items-end sm:items-center" : "items-end sm:items-center")
      }
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 baggo-backdrop-enter"
        onClick={() => onClose?.()}
        aria-label="Close dialog"
      />

      <div
        className={
          "relative w-full border border-[var(--color-border)] bg-[var(--color-surface)] " +
          (isSheet
            ? // bottom-sheet feel on mobile
              `rounded-t-2xl shadow-none ${widthClass} baggo-sheet-enter sm:rounded-2xl sm:shadow-xl sm:baggo-modal-enter`
            : // normal modal
              `${widthClass} rounded-t-2xl sm:rounded-2xl shadow-xl baggo-modal-enter`)
        }
        // ensure full width on mobile even if widthClass includes max-w-*
        style={isSheet ? { maxWidth: "100%" } : undefined}
      >
        {/* iOS-style handle (mobile sheets) */}
        {isSheet ? (
          <div className="sm:hidden pt-2 pb-1">
            <div className="mx-auto h-1 w-10 rounded-full bg-[var(--color-border)]/80" />
          </div>
        ) : null}

        {/* Header */}
        <div
          className={
            "border-b border-[var(--color-border)] flex items-center justify-between gap-3 " +
            (isSheet ? "px-4 py-3" : "p-5")
          }
        >
          <div className="flex-1 min-w-0">
            {title ? (
              <h3
                className={
                  (isSheet ? "text-base" : "text-lg") +
                  " font-semibold text-[var(--color-text)] leading-tight truncate"
                }
              >
                {title}
              </h3>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close"
            className={
              isSheet
                ? "h-9 w-9 grid place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] active:scale-[0.98]"
                : "rounded-full px-3 py-1 text-sm border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
            }
          >
            {isSheet ? "✕" : "Close"}
          </button>
        </div>

        {/* Body */}
        <div className={(isSheet ? "px-4 py-4" : "p-5") + " max-h-[70vh] overflow-auto"}>
          {children}
        </div>

        {/* Footer */}
        {footer ? (
          <div
            className={
              (isSheet
                ? "px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
                : "p-5") +
              " border-t border-[var(--color-border)] bg-[var(--color-surface)]"
            }
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
