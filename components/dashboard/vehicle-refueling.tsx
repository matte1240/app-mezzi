"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Fuel, 
  Plus, 
  Loader2,
  X,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";

type RefuelingRecord = {
  id: string;
  date: string;
  liters: number;
  cost: number;
  mileage: number;
  notes: string | null;
};

type VehicleRefuelingProps = {
  vehicleId: string;
  currentMileage: number;
  initialRecords: RefuelingRecord[];
};

export default function VehicleRefueling({ 
  vehicleId, 
  currentMileage, 
  initialRecords 
}: VehicleRefuelingProps) {
  const router = useRouter();
  const [records, setRecords] = useState<RefuelingRecord[]>(initialRecords);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RefuelingRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    liters: "",
    cost: "",
    mileage: currentMileage,
    notes: ""
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      liters: "",
      cost: "",
      mileage: currentMileage,
      notes: ""
    });
    setEditingRecord(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (record: RefuelingRecord) => {
    setEditingRecord(record);
    setFormData({
      date: format(new Date(record.date), "yyyy-MM-dd"),
      liters: record.liters.toString(),
      cost: record.cost.toString(),
      mileage: record.mileage,
      notes: record.notes || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo rifornimento?")) return;
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/refueling/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Errore durante l'eliminazione");
          return;
        }

        setRecords(prev => prev.filter(r => r.id !== id));
        router.refresh();
      } catch {
        alert("Si è verificato un errore imprevisto");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const url = editingRecord 
          ? `/api/refueling/${editingRecord.id}`
          : `/api/vehicles/${vehicleId}/refueling`;
        
        const method = editingRecord ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            liters: parseFloat(formData.liters),
            cost: parseFloat(formData.cost),
            mileage: Number(formData.mileage)
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Errore durante il salvataggio");
          return;
        }

        // Add new record or update existing and resort
        const savedRecord = {
            ...data,
            date: data.date 
        };
        
        setRecords(prev => {
          const filtered = editingRecord ? prev.filter(r => r.id !== editingRecord.id) : prev;
          return [savedRecord, ...filtered].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
        
        setIsModalOpen(false);
        resetForm();
        router.refresh();
      } catch {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Rifornimenti
        </h3>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Registra Rifornimento
        </button>
      </div>

       {/* List */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Data</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Litri</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Costo</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Km</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Note</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Nessun rifornimento registrato
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="group hover:bg-muted/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      {format(new Date(record.date), "d MMM yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {Number(record.liters).toFixed(2)} L
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      € {Number(record.cost).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {record.mileage.toLocaleString("it-IT")} km
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-1 max-w-[200px] text-muted-foreground">
                        {record.notes || "-"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(record)}
                          className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground"
                          title="Modifica"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 dark:hover:bg-red-900/20"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
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
                {editingRecord ? "Modifica Rifornimento" : "Nuovo Rifornimento"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
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
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Litri</label>
                    <div className="relative">
                        <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.liters}
                        onChange={e => setFormData(prev => ({ ...prev, liters: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="absolute right-3 top-2 text-muted-foreground text-sm">L</span>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Costo Totale</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-muted-foreground text-sm">€</span>
                        <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.cost}
                        onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Chilometraggio</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.mileage}
                    onChange={e => setFormData(prev => ({ ...prev, mileage: Number(e.target.value) }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="absolute right-3 top-2 text-muted-foreground text-sm">km</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Note (Opzionale)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingRecord ? "Salva Modifiche" : "Salva Rifornimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
