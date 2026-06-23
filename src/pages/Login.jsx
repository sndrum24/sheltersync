import { useState } from "react";
import { supabase } from "@/api/supabaseClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert([
              {
                id: data.user.id,
                email: data.user.email,
                role: "volunteer",
              },
            ]);

          if (profileError) {
            console.error(profileError);
          }
        }

        alert(
          "Account created. Check your email if confirmation is enabled."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        navigate("/");
      }
    } catch (err) {
      alert(err.message);
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isSignup ? "Create Account" : "Login"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Email</Label>

              <Input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>

              <Input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Login"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                setIsSignup(!isSignup)
              }
            >
              {isSignup
                ? "Already have an account?"
                : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}