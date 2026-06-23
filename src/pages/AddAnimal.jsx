import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import AnimalForm from "@/components/animals/AnimalForm";
import { useShelter } from "@/hooks/useShelter";
import { supabase } from "@/api/supabaseClient";

export default function AddAnimal() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useShelter();
console.log("USER FROM HOOK:", JSON.stringify(user, null, 2));

  const handleSubmit = async (data) => {
  try {
    setIsSubmitting(true);

    const payload = {
  ...data,
  shelter_id: user?.shelter_id,
};
const { canEditAnimals } = useShelter();

if (!canEditAnimals) {
  return (
    <div className="p-6">
      You do not have permission to add animals.
    </div>
  );
}

    console.log("USER:", user);
    console.log("DATA:", data);
    console.log("PAYLOAD:", payload);

    const { error } = await supabase
      .from("animals")
      .insert([payload]);

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    queryClient.invalidateQueries({
      queryKey: ["animals"],
    });

    navigate("/animals");
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/animals">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            Add New Animal
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Fill in the details for the new shelter animal
          </p>
        </div>
      </div>

      <AnimalForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}