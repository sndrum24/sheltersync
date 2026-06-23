import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
      setUser(null);
      setLoading(false);
      return;
    }

    // ✅ FIXED ROLE NORMALIZATION
    setUser({
      ...profile,
      role: profile?.role?.toLowerCase() || "volunteer",
    });

    setLoading(false);
  };

  useEffect(() => {
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        getUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth: loading,
        logout: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);