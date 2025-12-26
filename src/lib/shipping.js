import { supabase, supabaseEnabled } from "./supabase";

const DEFAULT = {
  methods: [
    { code: "delivery", label: "Delivery", fee: 0, active: true, sort_order: 0 },
  ],
  free_threshold: null,
};

function normalizeMethods(methods) {
  if (!Array.isArray(methods)) return [...DEFAULT.methods];
  return methods
    .map((m) => ({
      code: String(m?.code || "").trim(),
      label: String(m?.label || "").trim() || String(m?.code || "").trim() || "Delivery",
      fee: Number(m?.fee || 0),
      active: m?.active !== false,
      sort_order: Number(m?.sort_order ?? 0),
    }))
    .filter((m) => m.code)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function fetchShippingSettings() {
  if (!supabaseEnabled) {
    return { ok: true, settings: { ...DEFAULT } };
  }

  try {
    const { data, error } = await supabase
      .from("shipping_settings")
      .select("id,methods,free_threshold")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    const methods = normalizeMethods(data?.methods);
    const thr = data?.free_threshold;
    return {
      ok: true,
      settings: {
        methods: methods.length ? methods : [...DEFAULT.methods],
        free_threshold: thr === null || thr === undefined ? null : Number(thr),
      },
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e?.message ||
        "Couldn't load shipping settings. Make sure the shipping_settings table exists and RLS allows reading it.",
      settings: { ...DEFAULT },
    };
  }
}

export async function saveShippingSettings(nextSettings) {
  if (!supabaseEnabled) {
    return { ok: false, error: "Supabase not configured" };
  }

  const payload = {
    id: 1,
    methods: normalizeMethods(nextSettings?.methods),
    free_threshold:
      nextSettings?.free_threshold === "" || nextSettings?.free_threshold === undefined
        ? null
        : Number(nextSettings?.free_threshold),
  };

  try {
    const { error } = await supabase
      .from("shipping_settings")
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || "Failed to save shipping settings" };
  }
}
