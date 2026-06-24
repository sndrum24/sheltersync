import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        const user = data?.user;

        if (user) {
          // Create profile (safe default role)
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              email: user.email,
              role: "volunteer",
            });

          if (profileError) throw profileError;

          // Optional fallback membership (safe default)
          await supabase.from("shelter_members").insert({
            user_id: user.id,
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
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          setEmail("");
          setPassword("");
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    
    <form onSubmit={handleSubmit} className="space-y-4 w-80 text-center">

      {/* HEADER */}
      <div className="mb-6">
        <div className="text-5xl mb-2">🐾</div>

        <h1 className="text-2xl font-bold">
          Welcome to <span className="text-red-600">ShelterSync</span>
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Together, we make a difference.
        </p>
      </div>

      {/* LOGIN CARD */}
      <div className="space-y-3 text-left">

        <input
          className="w-full border p-2 rounded"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-black text-white p-2 rounded">
          {loading ? "Loading..." : isSignup ? "Create Account" : "Login"}
        </button>

        {/* TOGGLE */}
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="w-full border p-2 rounded"
        >
          {isSignup ? "Login" : "Sign Up"}
        </button>

      </div>
    </form>
  </div>
);
}