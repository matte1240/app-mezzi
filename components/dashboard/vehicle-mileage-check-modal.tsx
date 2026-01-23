"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, X, AlertCircle, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
};

export default function VehicleMileageCheckModal({ isOpen, onClose, vehicleId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
      date: format(new Date(), "yyyy-MM-dd"),
      km: "",
      notes: ""
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const kmValue = parseInt(formData.km);
    if (isNaN(kmValue) || kmValue < 0) {
        setError("Inserisci un valore valido per i chilometri.");
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/mileage-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           date: new Date(formData.date).toISOString(),
           km: kmValue,
           notes: formData.notes
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Errore durante il salvataggio");
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
      setFormData({ date: format(new Date(), "yyyy-MM-dd"), km: "", notes: "" });

    } catch {
      setError("Si è verificato un errore imprevisto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Registra Controllo Km
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive flex gap-2 items-start border border-destructive/20">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Data Controllo</label>
                <div className="relative">
                    <input 
                        type="date" 
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                </div>
            </div>

             <div className="space-y-2">
                <label className="text-sm font-medium">Chilometri Rilevati</label>
                <div className="relative">
                    <Input 
                        type="number" 
                        required
                        min="0"
                        placeholder="Es. 154000"
                        value={formData.km}
                        onChange={(e) => setFormData({...formData, km: e.target.value})}
                    />
                </div>
            </div>
            
             <div className="space-y-2">
                <label className="text-sm font-medium">Note (Opzionale)</label>
                <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Eventuali annotazioni..."
                     value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                    Annulla
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salva Controllo
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
}
