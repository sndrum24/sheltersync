import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    setUser({
      id: session.user.id,
      email: session.user.email,
      role: profile?.role?.toLowerCase() || "volunteer",
      ...profile,
    });

    setLoading(false);
  };

  useEffect(() => {
    loadUser();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(() => {
        loadUser();
      });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthUser = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthUser must be used inside AuthProvider");
  return ctx;
};