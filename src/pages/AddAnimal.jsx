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

  const { user, canEditAnimals } = useShelter(); // ✅ only call hook once

  const handleSubmit = async (data) => {
    try {
      setIsSubmitting(true);

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

      const { data: inserted, error } = await supabase
        .from("animals")
        .insert([payload])
        .select();

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: ["animals", user.shelter_id],
      });

      navigate("/animals");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return <AnimalForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initial={undefined} />;
}