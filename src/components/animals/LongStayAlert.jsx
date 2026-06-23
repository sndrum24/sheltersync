import { useState, useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronDown, ChevronUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const LONG_STAY_DAYS = 183; // ~6 months

const speciesEmoji = { dog: "🐕", cat: "🐈", rabbit: "🐇", bird: "🐦", reptile: "🦎", other: "🐾" };

export default function LongStayAlert({ animals }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const longStay = useMemo(() =>
    animals.filter((a) => {
      if (["adopted", "foster", "holding", "other"].includes(a.status)) return false;
      if (!a.intake_date) return false;
      return differenceInDays(new Date(), new Date(a.intake_date)) >= LONG_STAY_DAYS;
    }),
    [animals]
  );

  if (longStay.length === 0) return null;

  const handleTogglePriceless = async (animal, e) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase
  .from("animals")
  .update({
    priceless_pups: !animal.priceless_pups,
  })
  .eq("id", animal.id);

if (error) {
  console.error(error);
  return;
};

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Summary row */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-3 py-2.5 text-left"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-amber-800 flex-1">
            {longStay.length} animal{longStay.length !== 1 ? "s have" : " has"} been in the shelter for 6+ months
          </span>
          <span className="text-xs text-amber-600 hidden sm:block mr-2">
            {longStay.filter((a) => a.priceless_pups).length} marked for Priceless Pups Campaign
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-amber-600 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
          )}
        </button>

        {/* Expanded list */}
        {expanded && (
          <div className="pb-3 space-y-1.5">
            <p className="text-xs text-amber-700 mb-2 font-medium">
              Check the ⭐ box to prioritize an animal for the <strong>Priceless Pups Campaign</strong>
            </p>
            {longStay.map((animal) => {
              const days = differenceInDays(new Date(), new Date(animal.intake_date));
              const months = Math.floor(days / 30);
              return (
                <div
                  key={animal.id}
                  className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg px-3 py-2"
                >
                  <span className="text-lg flex-shrink-0">{speciesEmoji[animal.species] || "🐾"}</span>
                  <Link
                    to={`/animals/${animal.id}`}
                    className="flex-1 min-w-0 hover:underline"
                  >
                    <p className="text-sm font-semibold text-foreground truncate">{animal.name}</p>
                    <p className="text-xs text-muted-foreground">{months} months in shelter · {animal.location || "no location"}</p>
                  </Link>
                  {/* Priceless Pups toggle */}
                  <button
                    onClick={(e) => handleTogglePriceless(animal, e)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex-shrink-0",
                      animal.priceless_pups
                        ? "bg-amber-400 border-amber-500 text-white"
                        : "bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
                    )}
                  >
                    <Star className={cn("w-3.5 h-3.5", animal.priceless_pups && "fill-white")} />
                    <span className="hidden sm:inline">
                      {animal.priceless_pups ? "Priceless Pups ✓" : "Add to Campaign"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}}