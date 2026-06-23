import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useShelter } from "@/hooks/useShelter";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";

export default function ShelterSetup() {
  const { isAdmin, isOwner, isLoading } = useShelter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
  });

  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(true);

  if (isLoading) return <Loader2 className="animate-spin" />;
  if (!isAdmin && !isOwner) return <p>Not authorized</p>;

  const { data: shelters = [] } = useQuery({
    queryKey: ["shelters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shelters")
        .select("*");

      if (error) throw error;
      return data || [];
    },
  });

  const handleCreateShelter = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: authUser } = await supabase.auth.getUser();

      const { error } = await supabase.from("shelters").insert([
        {
          ...form,
          created_by: authUser?.user?.id,
        },
      ]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["shelters"] });

      setForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        description: "",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShelter = async (id) => {
    await supabase.from("shelters").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["shelters"] });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Shelter Setup</h1>

      {shelters.map((shelter) => (
        <Card key={shelter.id}>
          <CardContent className="flex justify-between p-4">
            <div>
              <h3 className="font-semibold">{shelter.name}</h3>
              <p className="text-sm text-muted-foreground">
                {shelter.address}
              </p>
            </div>

            <Button
              variant="destructive"
              onClick={() => handleDeleteShelter(shelter.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {showCreateForm && (
        <Card>
          <CardContent className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <Input
              placeholder="Address"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />

            <Button onClick={handleCreateShelter} disabled={creating}>
              {creating ? "Creating..." : "Create Shelter"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}