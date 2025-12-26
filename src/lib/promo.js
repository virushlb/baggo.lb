import { supabase, supabaseEnabled } from "./supabase";

function pick(obj, keys) {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, k) && obj[k] !== null && obj[k] !== undefined) {
      return obj[k];
    }
  }
  return undefined;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Validate a promo code (optional feature).
 *
 * Expected table: promo_codes
 * Common columns supported:
 *  - code (text)
 *  - type ("percent" | "fixed") OR discount_type
 *  - value (number) OR discount_value OR amount OR percent
 *  - active (boolean) OR is_active OR enabled
 *  - expires_at (timestamp) [optional]
 */
export async function validatePromoCode(code, subtotal) {
  if (!supabaseEnabled) {
    return { ok: false, error: "Promo codes aren't available in demo mode." };
  }

  const clean = String(code || "").trim().toUpperCase();
  if (!clean) return { ok: false, error: "Enter a promo code." };

  try {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", clean)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { ok: false, error: "Invalid promo code." };

    const active = pick(data, ["active", "is_active", "enabled"]);
    if (active === false) return { ok: false, error: "This promo code is inactive." };

    const expiresAt = pick(data, ["expires_at", "expiresAt", "expires"]);
    if (expiresAt) {
      const t = new Date(expiresAt);
      if (!Number.isNaN(t.getTime()) && t.getTime() < Date.now()) {
        return { ok: false, error: "This promo code has expired." };
      }
    }

    const rawType = String(pick(data, ["type", "discount_type", "kind"]) || "percent").toLowerCase();
    const rawValue = pick(data, ["value", "discount_value", "amount", "percent", "percentage"]);
    const value = toNumber(rawValue);
    if (value <= 0) return { ok: false, error: "Invalid promo value." };

    let type = "percent";
    if (rawType.includes("fixed") || rawType.includes("amount") || rawType.includes("flat")) type = "fixed";
    if (rawType.includes("percent") || rawType.includes("%")) type = "percent";

    // If type is unknown, guess.
    if (rawType === "unknown") {
      type = value <= 100 ? "percent" : "fixed";
    }

    // Compute a safe discount preview (client will recompute anyway).
    const sub = toNumber(subtotal);
    const discount = Math.max(0, Math.min(sub, type === "fixed" ? value : (sub * value) / 100));

    return {
      ok: true,
      promo: {
        code: clean,
        type,
        value,
        discount,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e?.message ||
        "Couldn't validate this code. Make sure the promo_codes table exists and your RLS policies allow reading it.",
    };
  }
}
