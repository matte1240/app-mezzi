"use client";

import { useState, useEffect, useTransition } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Fuel, Loader2, Plus, X, AlertCircle } from "lucide-react";

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
  userId: string;
};

export default function EmployeeRefuelingPageContent({ vehicles, userId }: Props) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [records, setRecords] = useState<RefuelingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vehicleId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    liters: "",
    cost: "",
    mileage: "",
    notes: ""
  });

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("startDate", startDate);
      params.append("endDate", endDate);
      params.append("userId", userId); // Filter by user

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

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleOpenModal = () => {
    setFormData({
      vehicleId: vehicles.length > 0 ? vehicles[0].id : "",
      date: format(new Date(), "yyyy-MM-dd"),
      liters: "",
      cost: "",
      mileage: "",
      notes: ""
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.vehicleId) {
        setError("Seleziona un veicolo");
        return;
    }

    startTransition(async () => {
      try {
        const url = `/api/vehicles/${formData.vehicleId}/refueling`;
        
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: formData.date,
            liters: parseFloat(formData.liters),
            cost: parseFloat(formData.cost),
            mileage: Number(formData.mileage),
            notes: formData.notes
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Errore durante il salvataggio");
          return;
        }

        setIsModalOpen(false);
        fetchData(); // Refresh list
      } catch {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:px-12 md:py-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">I Miei Rifornimenti</h2>
        <button
          onClick={handleOpenModal}
          disabled={vehicles.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Registra Rifornimento
        </button>
      </div>

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
          </div>
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

       {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Registra Rifornimento
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Veicolo *</label>
                <select
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                >
                    {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.name} ({v.plate})
                        </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Data</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Litri</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={formData.liters}
                    onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Costo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Km attuali</label>
                  <input
                    type="number"
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="Es: 150000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Note</label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Eventuali note..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
