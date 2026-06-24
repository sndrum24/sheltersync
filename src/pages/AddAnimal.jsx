import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";

import AnimalForm from "@/components/animals/AnimalForm";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddAnimal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,

        // -----------------------------
        // SAFE NUMBER NORMALIZATION
        // -----------------------------
        age_years:
          data.age_years !== "" && data.age_years != null
            ? Number(data.age_years)
            : null,

        age_months:
          data.age_months !== "" && data.age_months != null
            ? Number(data.age_months)
            : null,

        weight_lbs:
          data.weight_lbs !== "" && data.weight_lbs != null
            ? Number(data.weight_lbs)
            : null,

        // -----------------------------
        // DEFAULT STRINGS / FALLBACKS
        // -----------------------------
        status: data.status || "intake",
        health_status: data.health_status || "healthy",
        house_restrictions: data.house_restrictions || [],

        intake_type: data.intake_type || null,
        location: data.location || "",
        color: data.color || "",

        // -----------------------------
        // BOOLEAN NORMALIZATION
        // -----------------------------
        spayed_neutered: Boolean(data.spayed_neutered),
        vaccinated: Boolean(data.vaccinated),
        microchipped: Boolean(data.microchipped),
        evaluated: Boolean(data.evaluated),
        playgroup_eligible: Boolean(data.playgroup_eligible),

        // -----------------------------
        // SYSTEM DEFAULT FIELDS
        // -----------------------------
        pending: false,
        priceless_pups: false,
      };

      const { error } = await supabase
        .from("animals")
        .insert(payload);

      if (error) throw error;

      // refresh animals list everywhere
      queryClient.invalidateQueries({ queryKey: ["animals"] });

      // go back
      navigate("/animals");
    } catch (err) {
      console.error("Create animal error:", err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="Add New Animal">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/animals")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="text-2xl font-bold">
          Add New Animal
        </h1>
      </div>

      {/* FORM */}
      <AnimalForm
        initial={null}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />
    </PageShell>
  );
}