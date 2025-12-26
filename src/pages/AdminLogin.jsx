import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseEnabled } from "../lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isAdmin } from "../lib/admin";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const msg = useMemo(() => String(searchParams.get("msg") || "").toLowerCase(), [searchParams]);

  useEffect(() => {
    if (!msg) return;
    if (msg === "noadmin") setInfo("This account is not allowed to access Admin yet. Ask the owner to add you to the admins list in Supabase.");
    if (msg === "nosupabase") setInfo("Supabase is not configured. Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env and restart the dev server.");
  }, [msg]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!supabaseEnabled) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env and restart.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError(error.message);
      return;
    }

    // Extra safety: only allow users in the `admins` table.
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;

    const ok = await isAdmin(userId);
    if (!ok) {
      await supabase.auth.signOut();
      setError("Not an admin account. Add your user ID to the `admins` table in Supabase.");
      return;
    }

    navigate("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm p-6 rounded-xl bg-[var(--color-surface)] border"
      >
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>

        {info && <p className="text-amber-600 mb-3 text-sm">{info}</p>}
        {error && <p className="text-red-500 mb-3">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full py-2 rounded bg-black text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}
