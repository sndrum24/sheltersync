import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimalCard from "@/components/animals/AnimalCard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function sortByKennel(animals = []) {
  return [...animals].sort((a, b) =>
    (a.location || "").localeCompare(b.location || "", undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}

function printFolder(title, animals = []) {
  const rows = animals
    .map((a) => {
      const age =
        [
          a.age_years ? `${a.age_years}yr` : "",
          a.age_months ? `${a.age_months}mo` : "",
        ]
          .filter(Boolean)
          .join(" ") || "—";

      const safe = (v) => (typeof v === "string" ? v : "—");

      return `
        <tr>
          <td>${safe(a.name)}</td>
          <td style="text-transform:capitalize">${safe(a.species)}</td>
          <td>${safe(a.breed)}</td>
          <td style="text-transform:capitalize">${safe(a.gender)}</td>
          <td>${age}</td>
          <td>${safe(a.location)}</td>
          <td style="text-transform:capitalize">${safe(a.health_status).replace("_", " ")}</td>
          <td style="text-transform:capitalize">${safe(a.status).replace("_", " ")}</td>
        </tr>`;
    })
    .join("");

  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 30px; color: #111827; }
      h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
      .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-weight: 600; }
      td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
    </style>
  </head><body>
    <h1>${title}</h1>
    <p class="meta">${animals.length} animals · Printed ${format(
      new Date(),
      "MMMM d, yyyy"
    )}</p>
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Species</th><th>Breed</th><th>Gender</th>
          <th>Age</th><th>Location</th><th>Health</th><th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`);

  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export default function AnimalFolder({
  title,
  animals = [],
  icon: Icon,
  iconColor,
  defaultOpen = false,
  sortByKennelNumber = false,
  filtersActive = false,
  sort = "default",
  selectable = false,
  selectedIds,
  onToggleSelect,
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (filtersActive) setOpen(true);
  }, [filtersActive]);

  const safeAnimals = Array.isArray(animals) ? animals : [];

  if (safeAnimals.length === 0) return null;

  let displayAnimals = sortByKennelNumber
    ? sortByKennel(safeAnimals)
    : [...safeAnimals];

  if (sort === "intake_asc") {
    displayAnimals.sort(
      (a, b) =>
        new Date(a.intake_date || 0) - new Date(b.intake_date || 0)
    );
  } else if (sort === "intake_desc") {
    displayAnimals.sort(
      (a, b) =>
        new Date(b.intake_date || 0) - new Date(a.intake_date || 0)
    );
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-card">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
          <span className="font-semibold">{title}</span>
          <span className="text-sm text-muted-foreground">
            ({safeAnimals.length})
          </span>

          {open ? (
            <ChevronDown className="w-4 h-4 ml-auto" />
          ) : (
            <ChevronRight className="w-4 h-4 ml-auto" />
          )}
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            printFolder(title, displayAnimals);
          }}
        >
          <Printer className="w-4 h-4" />
        </Button>
      </div>

      {open && (
        <div className="p-5 border-t border-border bg-muted/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayAnimals.map((animal) => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                selectable={selectable}
                selected={selectedIds?.has(animal.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}