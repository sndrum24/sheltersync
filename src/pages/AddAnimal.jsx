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

  // ✅ upload helper
  const uploadAnimalImage = async (file, animalId) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${animalId}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("animal-photos")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("animal-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

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

      // STEP 1: insert animal WITHOUT image
      const { error } = await supabase
  .from("animals")
  .insert([
    {
      ...data,
      shelter_id: user.shelter_id,
    },
  ]);
        .select()
        .single();

      if (error) throw error;

      let photoUrl = null;

      // STEP 2: upload image if exists
      if (data.photo) {
        photoUrl = await uploadAnimalImage(data.photo, inserted.id);
      }

      // STEP 3: update animal with photo_url
      if (photoUrl) {
        await supabase
          .from("animals")
          .update({ photo_url: photoUrl })
          .eq("id", inserted.id);
      }

      // STEP 4: refresh UI
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/animals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Add New Animal</h1>
          <p className="text-muted-foreground">
            Fill in the details for the new animal
          </p>
        </div>
      </div>

      <AnimalForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}