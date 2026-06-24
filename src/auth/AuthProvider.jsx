import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async (sessionArg) => {
    const { data } = await supabase.auth.getSession();
    const session = sessionArg || data?.session;

    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile load error:", error);
    }

    const role = profile?.role?.toLowerCase() || "volunteer";

    const normalizedUser = {
      id: session.user.id,
      email: session.user.email,
      role,
      shelter_id: profile?.shelter_id || null,

      // ✅ RBAC FLAGS (CRITICAL FIX)
      isOwner: role === "owner",
      isAdmin: role === "admin" || role === "owner",
      isStaff: role === "staff" || role === "admin" || role === "owner",
      isVolunteer: role === "volunteer",
    };

    setUser(normalizedUser);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      loadUser(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthUser = () => useContext(AuthContext);