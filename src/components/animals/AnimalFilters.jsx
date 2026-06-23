import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const speciesOptions = [
  { value: "all", label: "All Species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "rabbit", label: "Rabbits" },
  { value: "bird", label: "Birds" },
  { value: "reptile", label: "Reptiles" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "intake", label: "Intake" },
  { value: "available", label: "Available" },
  { value: "adopted", label: "Adopted" },
  { value: "foster", label: "Foster" },
  { value: "medical_hold", label: "Medical Hold" },
  { value: "quarantine", label: "Quarantine" },
  { value: "holding", label: "Holding" },
  { value: "other", label: "Other" },
];

const sortOptions = [
  { value: "default", label: "Default" },
  { value: "intake_asc", label: "Intake: Closest First" },
  { value: "intake_desc", label: "Intake: Farthest First" },
];

function FilterOption({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-colors",
        active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
      )}
    >
      {label}
      {active && <Check className="w-4 h-4" />}
    </button>
  );
}

export default function AnimalFilters({
  search, onSearchChange,
  species, onSpeciesChange,
  status, onStatusChange,
  breed, onBreedChange,
  location, onLocationChange,
  sort, onSortChange,
  onApply,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Local draft state for desktop filters
  const [draftSpecies, setDraftSpecies] = useState(species);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftBreed, setDraftBreed] = useState(breed);
  const [draftLocation, setDraftLocation] = useState(location);
  const [draftSort, setDraftSort] = useState(sort);
  const [draftSearch, setDraftSearch] = useState(search);

  const handleApply = () => {
    onSearchChange(draftSearch);
    onSpeciesChange(draftSpecies);
    onStatusChange(draftStatus);
    onBreedChange(draftBreed);
    onLocationChange(draftLocation);
    onSortChange(draftSort);
    if (onApply) onApply();
  };

  const handleClear = () => {
    setDraftSearch("");
    setDraftSpecies("all");
    setDraftStatus("all");
    setDraftBreed("");
    setDraftLocation("");
    setDraftSort("default");
    onSearchChange("");
    onSpeciesChange("all");
    onStatusChange("all");
    onBreedChange("");
    onLocationChange("");
    onSortChange("default");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleApply();
  };

  const activeFiltersCount =
    (draftSpecies !== "all" ? 1 : 0) +
    (draftStatus !== "all" ? 1 : 0) +
    (draftBreed ? 1 : 0) +
    (draftLocation ? 1 : 0) +
    (draftSort !== "default" ? 1 : 0);

  const hasAnyFilter = activeFiltersCount > 0 || draftSearch;

  return (
    <div className="flex flex-col gap-3">
      {/* Main row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, breed..."
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-3"
          />
        </div>

        {/* Desktop selects */}
        <div className="hidden sm:flex gap-2 flex-wrap items-center">
          <Select value={draftSpecies} onValueChange={setDraftSpecies}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Species" />
            </SelectTrigger>
            <SelectContent>
              {speciesOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={draftStatus} onValueChange={setDraftStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input
            placeholder="Breed..."
            value={draftBreed}
            onChange={(e) => setDraftBreed(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-32"
          />

          <Input
            placeholder="Location..."
            value={draftLocation}
            onChange={(e) => setDraftLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-32"
          />

          <Select value={draftSort} onValueChange={setDraftSort}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button onClick={handleApply} className="gap-1.5">
            <Search className="w-4 h-4" />
            Search
          </Button>

          {hasAnyFilter && (
            <Button variant="ghost" size="icon" onClick={handleClear} title="Clear filters">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Mobile: search button + drawer */}
        <div className="sm:hidden flex gap-2">
          <Button onClick={handleApply} className="gap-1.5 flex-1">
            <Search className="w-4 h-4" />
            Search
          </Button>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="px-4 pb-8 space-y-6">
                <DrawerHeader className="px-0 pb-0">
                  <DrawerTitle>Filter Animals</DrawerTitle>
                </DrawerHeader>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Species</p>
                  <div className="space-y-0.5">
                    {speciesOptions.map((o) => (
                      <FilterOption key={o.value} label={o.label} active={draftSpecies === o.value} onClick={() => setDraftSpecies(o.value)} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Status</p>
                  <div className="space-y-0.5">
                    {statusOptions.map((o) => (
                      <FilterOption key={o.value} label={o.label} active={draftStatus === o.value} onClick={() => setDraftStatus(o.value)} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Breed</p>
                  <Input placeholder="Filter by breed..." value={draftBreed} onChange={(e) => setDraftBreed(e.target.value)} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Location</p>
                  <Input placeholder="Filter by location..." value={draftLocation} onChange={(e) => setDraftLocation(e.target.value)} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Sort by Intake Date</p>
                  <div className="space-y-0.5">
                    {sortOptions.map((o) => (
                      <FilterOption key={o.value} label={o.label} active={draftSort === o.value} onClick={() => setDraftSort(o.value)} />
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={() => { handleApply(); setDrawerOpen(false); }}>
                  Apply Filters
                </Button>
                {hasAnyFilter && (
                  <Button variant="outline" className="w-full" onClick={() => { handleClear(); setDrawerOpen(false); }}>
                    Clear All
                  </Button>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
}