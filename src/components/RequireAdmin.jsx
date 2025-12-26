import { useEffect, useState } from "react";
import { supabase, supabaseEnabled } from "../lib/supabase";
import { Navigate } from "react-router-dom";
import { isAdmin } from "../lib/admin";

export default function RequireAdmin({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!supabaseEnabled) {
        if (!mounted) return;
        setLoading(false);
        setSession(null);
        setAllowed(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const s = data?.session || null;
      setSession(s);

      if (!s?.user?.id) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const ok = await isAdmin(s.user.id);
      if (!mounted) return;

      setAllowed(ok);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return null;

  if (!supabaseEnabled) return <Navigate to="/admin-login?msg=nosupabase" replace />;
  if (!session) return <Navigate to="/admin-login" replace />;
  if (!allowed) return <Navigate to="/admin-login?msg=noadmin" replace />;

  return children;
}
