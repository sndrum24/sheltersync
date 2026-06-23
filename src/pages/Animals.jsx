import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PawPrint, Plus, FolderHeart, FolderOpen, Dog, Cat, AlertCircle, MapPin, Home, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AnimalCard from "@/components/animals/AnimalCard";
import AnimalFilters from "@/components/animals/AnimalFilters";
import AnimalFolder from "@/components/animals/AnimalFolder";
import BulkEditBar from "@/components/animals/BulkEditBar";
import MessageStaffDialog from "@/components/animals/MessageStaffDialog";
import StaffMessagesInbox from "@/components/animals/StaffMessagesInbox";
import { useShelter } from "@/hooks/useShelter";
import { supabase } from "@/api/supabaseClient";

const FOLDER_STATUSES = new Set(["adopted", "foster", "medical_hold", "quarantine", "other"]);

export default function Animals() {
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("all");
  const [status, setStatus] = useState("all");
  const [breed, setBreed] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("default");

  // Selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filtersActive = !!(search || species !== "all" || status !== "all" || breed || location);
  const { user, shelter, isAdmin } = useShelter();

const { data: animals = [], isLoading } = useQuery({
  queryKey: ["animals"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;
  },
});

  const matchesFilters = useMemo(() => (a) => {
    const matchSearch = !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.breed?.toLowerCase().includes(search.toLowerCase());
    const matchSpecies = species === "all" || a.species === species;
    const matchStatus = status === "all" || a.status === status;
    const matchBreed = !breed || a.breed?.toLowerCase().includes(breed.toLowerCase());
    const matchLocation = !location || a.location?.toLowerCase().includes(location.toLowerCase());
    return matchSearch && matchSpecies && matchStatus && matchBreed && matchLocation;
  }, [search, species, status, breed, location]);

  const filtered = useMemo(() => {
    let result = animals.filter((a) => {
      if (FOLDER_STATUSES.has(a.status)) return false;
      if ((a.species === "dog" || a.species === "cat") && a.status === "available") return false;
      return matchesFilters(a);
    });
    if (sort === "intake_asc") {
      result = [...result].sort((a, b) => {
        if (!a.intake_date) return 1;
        if (!b.intake_date) return -1;
        return new Date(a.intake_date) - new Date(b.intake_date);
      });
    } else if (sort === "intake_desc") {
      result = [...result].sort((a, b) => {
        if (!a.intake_date) return 1;
        if (!b.intake_date) return -1;
        return new Date(b.intake_date) - new Date(a.intake_date);
      });
    }
    return result;
  }, [animals, matchesFilters, sort]);

  const adoptedAnimals = useMemo(() => animals.filter((a) => a.status === "adopted" && matchesFilters(a)), [animals, matchesFilters]);
  const fosterAnimals = useMemo(() => animals.filter((a) => a.status === "foster" && matchesFilters(a)), [animals, matchesFilters]);
  const availableDogs = useMemo(() => animals.filter((a) => a.species === "dog" && a.status === "available" && matchesFilters(a)), [animals, matchesFilters]);
  const availableCats = useMemo(() => animals.filter((a) => a.species === "cat" && a.status === "available" && matchesFilters(a)), [animals, matchesFilters]);
  const otherAnimals = useMemo(() => animals.filter((a) => (a.status === "medical_hold" || a.status === "quarantine") && matchesFilters(a)), [animals, matchesFilters]);
  const offPropertyAnimals = useMemo(() => animals.filter((a) => a.status === "other" && matchesFilters(a)), [animals, matchesFilters]);
  const availableDomestic = useMemo(() => animals.filter((a) => a.status === "available" && a.species !== "dog" && a.species !== "cat" && matchesFilters(a)), [animals, matchesFilters]);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const folderProps = {
    selectable: selectMode,
    selectedIds,
    onToggleSelect: handleToggleSelect,
  };
  console.log("ANIMALS:", animals);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Animals</h1>
          <p className="text-muted-foreground mt-1">{animals.length} animals at {shelter?.name || "your shelter"}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isAdmin && <MessageStaffDialog user={user} shelterId={user?.shelter_id} />}
          {isAdmin && <StaffMessagesInbox shelterId={user?.shelter_id} />}
          <Button
            variant={selectMode ? "default" : "outline"}
            onClick={() => { setSelectMode((v) => !v); setSelectedIds(new Set()); }}
            className="gap-2"
          >
            <MousePointerClick className="w-4 h-4" />
            {selectMode ? "Cancel Select" : "Select"}
          </Button>
          {isAdmin && (
            <Link to="/animals/new">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Animal</Button>
            </Link>
          )}
        </div>
      </div>

      {selectMode && selectedIds.size > 0 && (
        <BulkEditBar
          selectedIds={selectedIds}
          shelterId={user?.shelter_id}
          onClear={handleClearSelection}
        />
      )}

      <AnimalFilters
        search={search} onSearchChange={setSearch}
        species={species} onSpeciesChange={setSpecies}
        status={status} onStatusChange={setStatus}
        breed={breed} onBreedChange={setBreed}
        location={location} onLocationChange={setLocation}
        sort={sort} onSortChange={setSort}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 && availableDogs.length === 0 && availableCats.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <PawPrint className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">No animals found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or add a new animal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      )}

      {/* Species folders for available animals */}
      <AnimalFolder title="Available Dogs" animals={availableDogs} icon={Dog} iconColor="text-amber-500" sortByKennelNumber filtersActive={filtersActive} sort={sort} {...folderProps} />
      <AnimalFolder title="Available Cats" animals={availableCats} icon={Cat} iconColor="text-chart-5" sortByKennelNumber filtersActive={filtersActive} sort={sort} {...folderProps} />

      {/* Status folders */}
      <AnimalFolder title="Foster Animals" animals={fosterAnimals} icon={FolderOpen} iconColor="text-chart-4" sortByKennelNumber filtersActive={filtersActive} sort={sort} {...folderProps} />
      <AnimalFolder title="Adopted Animals" animals={adoptedAnimals} icon={FolderHeart} iconColor="text-chart-3" sortByKennelNumber filtersActive={filtersActive} sort={sort} {...folderProps} />
      <AnimalFolder title="Medical & Quarantine" animals={otherAnimals} icon={AlertCircle} iconColor="text-destructive" sortByKennelNumber filtersActive={filtersActive} sort={sort} {...folderProps} />
      <AnimalFolder title="Available Domestic Animals" animals={availableDomestic} icon={Home} iconColor="text-primary" sortByKennelNumber filtersActive={filtersActive} sort={sort} {...folderProps} />
      <AnimalFolder title="Off Property" animals={offPropertyAnimals} icon={MapPin} iconColor="text-chart-5" sortByKennelNumber filtersActive={filtersActive} sort={sort} {...folderProps} />
    </div>
  );
}