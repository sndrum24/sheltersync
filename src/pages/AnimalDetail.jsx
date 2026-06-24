import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import AnimalForm from "@/components/animals/AnimalForm";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -----------------------------
  // LOAD ANIMAL
  // -----------------------------
  useEffect(() => {
    const fetchAnimal = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setAnimal(data);
      }

      setLoading(false);
    };

    if (id) fetchAnimal();
  }, [id]);

  // -----------------------------
  // UPDATE ANIMAL
  // -----------------------------
  const handleUpdate = async (formData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,

        age_years:
          formData.age_years !== "" && formData.age_years != null
            ? Number(formData.age_years)
            : null,

        age_months:
          formData.age_months !== "" && formData.age_months != null
            ? Number(formData.age_months)
            : null,

        weight_lbs:
          formData.weight_lbs !== "" && formData.weight_lbs != null
            ? Number(formData.weight_lbs)
            : null,

        spayed_neutered: !!formData.spayed_neutered,
        vaccinated: !!formData.vaccinated,
        microchipped: !!formData.microchipped,
        evaluated: !!formData.evaluated,
        playgroup_eligible: !!formData.playgroup_eligible,
      };

      const { error } = await supabase
        .from("animals")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      setAnimal(payload);
      setEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------
  // LOADING STATE
  // -----------------------------
  if (loading) {
    return (
      <PageShell>
        <p>Loading animal...</p>
      </PageShell>
    );
  }

  // -----------------------------
  // EDIT MODE (THIS IS YOUR FIX)
  // -----------------------------
  if (editing) {
    return (
      <PageShell title={`Edit ${animal?.name}`}>
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setEditing(false)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-2xl font-bold">
            Edit {animal?.name}
          </h1>
        </div>

        {/* FORM */}
        <AnimalForm
          initial={animal}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
        />
      </PageShell>
    );
  }

  // -----------------------------
  // VIEW MODE
  // -----------------------------
  return (
    <PageShell title={animal?.name}>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/animals")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Button onClick={() => setEditing(true)}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* BASIC INFO */}
      <div className="space-y-2 mt-4">
        <p><strong>Species:</strong> {animal?.species}</p>
        <p><strong>Breed:</strong> {animal?.breed}</p>
        <p><strong>Status:</strong> {animal?.status}</p>
      </div>
    </PageShell>
  );
}