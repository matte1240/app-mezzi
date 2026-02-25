"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, X, AlertCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MaintenanceType = "TAGLIANDO" | "GOMME" | "MECCANICA" | "REVISIONE" | "ALTRO";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  currentMileage: number;
};

export default function VehicleMaintenanceModal({ isOpen, onClose, vehicleId, currentMileage }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "TAGLIANDO" as MaintenanceType,
    mileage: currentMileage.toString(),
    cost: "",
    notes: "",
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      type: "TAGLIANDO",
      mileage: currentMileage.toString(),
      cost: "",
      notes: "",
    });
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const mileageValue = parseInt(formData.mileage);
    const costValue = formData.cost ? parseFloat(formData.cost) : undefined;

    if (isNaN(mileageValue) || mileageValue < 0) {
      setError("Inserisci un valore valido per i chilometri.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          type: formData.type,
          mileage: mileageValue,
          cost: costValue,
          notes: formData.notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante il salvataggio");
        setLoading(false);
        return;
      }

      router.refresh();
      handleClose();
    } catch {
      setError("Si è verificato un errore imprevisto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100vh-2rem)] my-auto">
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Registra Manutenzione
          </h3>
          <button onClick={handleClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive flex gap-2 items-start border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Intervento</label>
            <input
              type="date"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo Intervento</label>
            <select
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as MaintenanceType })}
            >
              <option value="TAGLIANDO">Tagliando</option>
              <option value="GOMME">Gomme</option>
              <option value="MECCANICA">Meccanica</option>
              <option value="REVISIONE">Revisione</option>
              <option value="ALTRO">Altro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chilometri</label>
              <Input
                type="number"
                required
                min="0"
                placeholder="Es. 154000"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Costo (€) — Opz.</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Es. 250.00"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Note (Opzionale)</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Eventuali annotazioni..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva Intervento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
