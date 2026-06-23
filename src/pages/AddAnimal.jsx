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

  const { user, canEditAnimals } = useShelter();

  const handleSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // guard clause
      if (!user?.shelter_id) {
        throw new Error("No shelter assigned to user");
      }

      if (!canEditAnimals) {
        alert("You do not have permission to add animals.");
        return;
      }

      const payload = {
        ...data,
        shelter_id: user.shelter_id,
      };

      console.log("PAYLOAD:", payload);

     const { data, error } = await supabase
  .from("animals")
  .insert([payload])
  .select();

console.log("INSERT RESULT:", { data, error });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      await queryClient.invalidateQueries({
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

      <AnimalForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}