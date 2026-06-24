import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import AnimalForm from "@/components/animals/AnimalForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddAnimal() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,

        // normalize numeric fields
        age_years: data.age_years || null,
        age_months: data.age_months || null,
        weight_lbs: data.weight_lbs || null,

        // ensure consistency with AnimalDetail expectations
        status: data.status || "intake",
        health_status: data.health_status || "healthy",
        house_restrictions: data.house_restrictions || [],

        // NEW fields used in AnimalDetail
        intake_type: data.intake_type || null,
        location: data.location || null,
        color: data.color || null,

        // booleans safety
        spayed_neutered: !!data.spayed_neutered,
        vaccinated: !!data.vaccinated,
        microchipped: !!data.microchipped,
        evaluated: !!data.evaluated,
        playgroup_eligible: !!data.playgroup_eligible,
        pending: false,
        priceless_pups: false,
      };

      const { error } = await supabase.from("animals").insert(payload);

      if (error) throw error;

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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/animals")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="font-heading text-2xl font-bold">
          Add New Animal
        </h1>
      </div>

      {/* FORM */}
      <AnimalForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}