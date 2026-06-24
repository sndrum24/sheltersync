import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { Link } from "react-router-dom";

import AnimalFolder from "@/components/animals/AnimalFolder";
import AnimalCard from "@/components/animals/AnimalCard";


import { useAuthUser } from "@/auth/AuthProvider"; 

import {
  PawPrint,
  Plus,
  MousePointerClick,
  AlertCircle,
  Cat,
  Dog,
  FolderHeart,
  FolderOpen,
  Home,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Animals() {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { user } = useAuthUser();
  const isAdmin = user?.isAdmin;
  const isOwner = user?.isOwner;
  const { data: animals = [] } = useQuery({
    queryKey: ["animals", user?.id],
    queryFn: async () => {
      let query = supabase.from("animals").select("*");

      if (!isOwner) {
        const shelterIds = shelters.map(s => s.id);
        if (!shelterIds.length) return [];

        query = query.in("shelter_id", shelterIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // -------------------------
  // FIX: DEFINE GROUPS
  // -------------------------
  const filtered = animals;

  const availableDogs = useMemo(
    () => filtered.filter(a => a.species === "dog"),
    [filtered]
  );

  const availableCats = useMemo(
    () => filtered.filter(a => a.species === "cat"),
    [filtered]
  );

  const fosterAnimals = useMemo(
    () => filtered.filter(a => a.status === "foster"),
    [filtered]
  );

  const adoptedAnimals = useMemo(
    () => filtered.filter(a => a.status === "adopted"),
    [filtered]
  );

  const otherAnimals = useMemo(
    () => filtered.filter(a => a.medical_flag === true),
    [filtered]
  );

  const availableDomestic = useMemo(
    () => filtered.filter(a => a.type === "domestic"),
    [filtered]
  );

  const offPropertyAnimals = useMemo(
    () => filtered.filter(a => a.location === "off-property"),
    [filtered]
  );

  return (
    <PageShell title="Animals">
      {/* HEADER */}
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Animals</h1>
          <p className="text-muted-foreground">{animals.length} animals</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectMode ? "default" : "outline"}
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds(new Set());
            }}
          >
            <MousePointerClick className="w-4 h-4 mr-2" />
            Select
          </Button>

          <Link to="/animals/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Animal
            </Button>
          </Link>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map(animal => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            selectable={selectMode}
            selected={selectedIds.has(animal.id)}
            onToggleSelect={(id) => {
              const newSet = new Set(selectedIds);
              newSet.has(id)
                ? newSet.delete(id)
                : newSet.add(id);
              setSelectedIds(newSet);
            }}
          />
        ))}
      </div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="text-center py-10">
          <PawPrint className="mx-auto mb-2" />
          No animals found
        </div>
      )}

      {/* FOLDERS */}
      <AnimalFolder title="Dogs" animals={availableDogs} icon={Dog} />
      <AnimalFolder title="Cats" animals={availableCats} icon={Cat} />
      <AnimalFolder title="Foster" animals={fosterAnimals} icon={FolderOpen} />
      <AnimalFolder title="Adopted" animals={adoptedAnimals} icon={FolderHeart} />
      <AnimalFolder title="Medical" animals={otherAnimals} icon={AlertCircle} />
      <AnimalFolder title="Domestic" animals={availableDomestic} icon={Home} />
      <AnimalFolder title="Off Property" animals={offPropertyAnimals} icon={MapPin} />
    </PageShell>
  );
}