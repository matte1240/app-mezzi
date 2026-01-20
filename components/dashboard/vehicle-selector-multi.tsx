"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Vehicle = {
  id: string;
  name: string;
  plate: string;
};

interface VehicleSelectorMultiProps {
  vehicles: Vehicle[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function VehicleSelectorMulti({
  vehicles,
  selectedIds,
  onChange,
}: VehicleSelectorMultiProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === vehicles.length) {
      onChange([]);
    } else {
      onChange(vehicles.map((v) => v.id));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full min-w-[250px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">
          {selectedIds.length === 0
            ? "Seleziona veicoli..."
            : selectedIds.length === vehicles.length
            ? "Tutti i veicoli"
            : `${selectedIds.length} veicoli selezionati`}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-1">
            <div
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onClick={selectAll}
            >
              <div className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  selectedIds.length === vehicles.length ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                )}>
                <Check className={cn("h-4 w-4")} />
              </div>
              <span className="font-medium">Seleziona tutti</span>
            </div>
            <div className="my-1 h-px bg-muted" />
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                onClick={() => toggleSelection(vehicle.id)}
              >
                 <div className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  selectedIds.includes(vehicle.id) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                )}>
                  <Check className={cn("h-4 w-4")} />
                </div>
                <span>{vehicle.name} ({vehicle.plate})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
