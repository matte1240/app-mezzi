"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Fuel, Download, Loader2 } from "lucide-react";
import { VehicleSelectorMulti } from "./vehicle-selector-multi";

type Vehicle = {
  id: string;
  name: string;
  plate: string;
};

type RefuelingRecord = {
  id: string;
  date: string;
  liters: number;
  cost: number;
  mileage: number;
  notes: string | null;
  vehicle: {
    id: string;
    name: string;
    plate: string;
  };
};

type Props = {
  vehicles: Vehicle[];
};

export default function RefuelingPageContent({ vehicles }: Props) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  // Initialize with all vehicles selected
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(() => 
    vehicles.map(v => v.id)
  );

  const [records, setRecords] = useState<RefuelingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("startDate", startDate);
        params.append("endDate", endDate);
        if (selectedVehicleIds.length > 0) {
           params.append("vehicleIds", selectedVehicleIds.join(","));
        } else {
            // If none selected, maybe we shouldn't fetch anything? Or fetch all? 
            // Let's assume if user deselects all, they see nothing.
            // But waiting for initial effect might cause a flash of "all". 
            // It's safer to send empty if we mean empty. 
            // BUT, my API implements: if vehicleIds is passed, filter by it. If NOT passed (null), return all (Wait, let's check API).
            // API: const vehicleIds = searchParams.get("vehicleIds")?.split(",")
            // If I don't append, it is null.
            // If selectedVehicleIds is empty array, and I don't append, API sees null -> returns ALL?
            // "if (vehicleIds && vehicleIds.length > 0)" -> if null, this is false. So it returns ALL.
            // So if I want to show NOTHING when nothing selected, I should handle that.
            // However, typical UX is "Select Vehicles", if none, maybe show all? 
            // Let's stick to: "If selectedVehicleIds is empty, we request empty list" -> "vehicleIds="
            // Wait, usually empty selection means specific filter is empty. 
            // Let's just handle "All selected by default".
        }
        
        // If nothing is selected, don't fetch or fetch nothing?
        // Let's fetch only if there are selected IDs.
        if (selectedVehicleIds.length === 0) {
            setRecords([]);
            setIsLoading(false);
            return;
        }

        const res = await fetch(`/api/refueling?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (error) {
        console.error("Failed to fetch refueling records", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce slightly or just run
    fetchData();
  }, [startDate, endDate, selectedVehicleIds]);

  const handleExport = () => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);
    if (selectedVehicleIds.length > 0) {
        params.append("vehicleIds", selectedVehicleIds.join(","));
    }
    window.location.href = `/api/refueling/export?${params.toString()}`;
  };

  const totalLiters = records.reduce((acc, r) => acc + r.liters, 0);
  const totalCost = records.reduce((acc, r) => acc + r.cost, 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:px-12 md:py-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Rifornimenti</h2>
      <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Al</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
               <label className="text-sm font-medium">Veicoli</label>
               <VehicleSelectorMulti 
                  vehicles={vehicles}
                  selectedIds={selectedVehicleIds}
                  onChange={setSelectedVehicleIds}
               />
            </div>

            <button
                onClick={handleExport}
                disabled={records.length === 0}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
                <Download className="h-4 w-4" />
                Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Totale Litri</h3>
                <Fuel className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalLiters.toFixed(2)} L</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Costo Totale</h3>
                <span className="text-muted-foreground font-bold">€</span>
            </div>
            <div className="text-2xl font-bold">€ {totalCost.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Rifornimenti</h3>
                <Fuel className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{records.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Veicolo</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Litri</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Costo</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Km</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Note</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2">
                         <Loader2 className="h-4 w-4 animate-spin"/> Caricamento...
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nessun rifornimento trovato nel periodo selezionato
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">{format(new Date(record.date), "dd/MM/yyyy")}</td>
                    <td className="p-4 align-middle">
                        <div className="font-medium">{record.vehicle.name}</div>
                        <div className="text-xs text-muted-foreground">{record.vehicle.plate}</div>
                    </td>
                    <td className="p-4 align-middle text-right">{record.liters.toFixed(2)}</td>
                    <td className="p-4 align-middle text-right">€ {record.cost.toFixed(2)}</td>
                    <td className="p-4 align-middle text-right">{record.mileage.toLocaleString()}</td>
                    <td className="p-4 align-middle max-w-[200px] truncate">{record.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
