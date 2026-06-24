import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import AnimalForm from "@/components/animals/AnimalForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PageShell from "@/components/layout/PageShell";

export default function AddAnimal() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,

        // -----------------------------
        // SAFE NUMBER NORMALIZATION
        // (fixes 0 being treated as false)
        // -----------------------------
        age_years:
          data.age_years !== "" && data.age_years !== null
            ? Number(data.age_years)
            : null,

        age_months:
          data.age_months !== "" && data.age_months !== null
            ? Number(data.age_months)
            : null,

        weight_lbs:
          data.weight_lbs !== "" && data.weight_lbs !== null
            ? Number(data.weight_lbs)
            : null,

        // -----------------------------
        // CONSISTENT DEFAULTS
        // -----------------------------
        status: data.status || "intake",
        health_status: data.health_status || "healthy",
        house_restrictions: data.house_restrictions || [],

        // -----------------------------
        // EXTRA FIELDS (SAFE DEFAULTS)
        // -----------------------------
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

        pending: false,
        priceless_pups: false,
      };

      const { error } = await supabase
        .from("animals")
        .insert(payload);

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

        <h1 className="font-heading text-2xl font-bold">
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