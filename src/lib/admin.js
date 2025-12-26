import { supabase, supabaseEnabled } from "./supabase";

export async function isAdmin(userId) {
  if (!supabaseEnabled) return false;
  const uid = userId || (await getCurrentUserId());
  if (!uid) return false;

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (error) return false;
  return Boolean(data && data.user_id);
}

export async function getCurrentUserId() {
  if (!supabaseEnabled) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}
