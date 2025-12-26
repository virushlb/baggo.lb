import { supabase, supabaseEnabled } from "./supabase";

const LOCAL_KEY = "BAGGO_ORDERS_LOCAL_V1";

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") || [];
  } catch {
    return [];
  }
}

function writeLocal(rows) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows || []));
  } catch {
    // ignore
  }
}

export async function createOrder(payload) {
  const clean = payload && typeof payload === "object" ? payload : {};

  if (!supabaseEnabled) {
    const id = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const next = {
      id,
      status: clean.status || "new",
      customer: clean.customer || {},
      items: Array.isArray(clean.items) ? clean.items : [],
      promo_code: clean.promo_code || null,
      delivery_method: clean.delivery_method || null,
      notes: clean.notes || "",
      subtotal: Number(clean.subtotal || 0),
      discount: Number(clean.discount || 0),
      shipping: Number(clean.shipping || 0),
      total: Number(clean.total || 0),
      created_at: new Date().toISOString(),
    };
    const rows = [next, ...readLocal()];
    writeLocal(rows);
    return { ok: true, id, local: true };
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        status: clean.status || "new",
        customer: clean.customer || {},
        items: Array.isArray(clean.items) ? clean.items : [],
        promo_code: clean.promo_code || null,
        delivery_method: clean.delivery_method || null,
        notes: clean.notes || "",
        subtotal: Number(clean.subtotal || 0),
        discount: Number(clean.discount || 0),
        shipping: Number(clean.shipping || 0),
        total: Number(clean.total || 0),
      })
      .select("id")
      .maybeSingle();

    if (error) throw error;
    const id = data?.id ? String(data.id) : "";
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e?.message || "Failed to create order" };
  }
}

export async function fetchOrders() {
  if (!supabaseEnabled) {
    return { ok: true, orders: readLocal(), local: true };
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { ok: true, orders: Array.isArray(data) ? data : [] };
  } catch (e) {
    return { ok: false, error: e?.message || "Failed to load orders", orders: [] };
  }
}

export async function updateOrderStatus(id, status) {
  if (!supabaseEnabled) {
    const rows = readLocal();
    const next = rows.map((o) => (String(o.id) === String(id) ? { ...o, status } : o));
    writeLocal(next);
    return { ok: true, local: true };
  }

  try {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || "Failed to update order" };
  }
}

export async function deleteOrder(id) {
  if (!supabaseEnabled) {
    const rows = readLocal().filter((o) => String(o.id) !== String(id));
    writeLocal(rows);
    return { ok: true, local: true };
  }
  try {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || "Failed to delete order" };
  }
}
