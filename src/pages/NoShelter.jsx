import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PawPrint, Building2, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export default function NoShelter() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-2xl font-bold">Welcome to PawShelter</h1>

      <p className="text-muted-foreground mt-2">
        Ask an admin to create a shelter and assign you.
      </p>

      <p className="text-muted-foreground mt-1">
        Contact your shelter administrator if you need access.
      </p>

      <Button className="mt-6" onClick={handleLogout}>
        Back to Login
      </Button>
    </div>
  );
}
