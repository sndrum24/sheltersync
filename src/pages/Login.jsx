import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // ✅ FIX: central auth listener (handles redirect safely)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // -------------------------
      // SIGN UP
      // -------------------------
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (user) {
          await supabase.from("profiles").insert({
            id: user.id,
            user_id: user.id,
            email: email.trim(),
            role: "volunteer",
          });
        }

        alert("Account created. Please log in.");
        setIsSignup(false);
        setEmail("");
        setPassword("");
      }

      // -------------------------
      // LOGIN
      // -------------------------
      else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data?.user) {
          setEmail("");
          setPassword("");

          console.log("LOGIN SUCCESS:", data.user);

          // ❌ REMOVED navigate from here (handled by useEffect)
        }
      }
    } catch (err) {
      setError(err.message);
      console.error("Login error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="space-y-4 w-80 text-center">
        <h1 className="text-2xl font-bold">Login</h1>

        {error && <p className="text-red-500">{error}</p>}

        <input
          className="w-full border p-2"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-black text-white p-2">
          {loading ? "Loading..." : isSignup ? "Sign Up" : "Login"}
        </button>

        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="w-full border p-2"
        >
          {isSignup ? "Switch to Login" : "Switch to Sign Up"}
        </button>
      </form>
    </div>
  );
}