import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  PawPrint, Plus, FolderHeart, FolderOpen,
  Dog, Cat, AlertCircle, MapPin, Home, MousePointerClick,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AnimalCard from "@/components/animals/AnimalCard";
import AnimalFolder from "@/components/animals/AnimalFolder";

import { useShelter } from "@/hooks/useShelter";
import { supabase } from "@/api/supabaseClient";

export default function Animals() {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const {
    user,
    isAdmin,
    isStaff,
    isOwner,
    memberships,
    shelter,
    canEditAnimals,
  } = useShelter();

  // -------------------------
  // RBAC FILTER FIX (OWNER OVERRIDE INCLUDED)
  // -------------------------
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ["animals", memberships],
    queryFn: async () => {
      let query = supabase.from("animals").select("*");

      if (!isOwner) {
        const shelterIds = memberships.map(m => m.shelter_id);

        if (shelterIds.length > 0) {
          query = query.in("shelter_id", shelterIds);
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });

  const filtered = useMemo(() => animals, [animals]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // =====================================================
  // UI (KEPT VERY CLOSE TO YOUR ORIGINAL)
  // =====================================================
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Animals</h1>
          <p className="text-muted-foreground">
            {animals.length} animals at {shelter?.name}
          </p>
        </div>

        <div className="flex gap-2">
          {!isAdmin && (
            <MessageStaffDialog user={user} shelterId={shelterId} />
          )}

          {isAdmin && (
            <StaffMessagesInbox shelterId={shelterId} />
          )}

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

          {isAdmin && (
            <Link to="/animals/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Animal
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((animal) => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            selectable={selectMode}
            selected={selectedIds.has(animal.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>

      {/* EMPTY STATE */}
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
    </div>
  );
}