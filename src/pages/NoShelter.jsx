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
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-2xl font-bold mb-2">
        No Shelter Access
      </h1>

      <p className="text-muted-foreground max-w-md">
        You currently do not have access to any shelter in this system.
        If you believe this is an error, contact an administrator.
      </p>

      <div className="mt-6 text-sm text-muted-foreground">
        Owners and admins automatically bypass shelter restrictions.
      </div>
    </div>
  );
}
