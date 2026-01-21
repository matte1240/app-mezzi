"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Truck,
  Gauge,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

type ActiveVehicle = {
  id: string;
  plate: string;
  name: string;
  type: string;
  lastMileage: number;
};

const TIME_OPTIONS = Array.from({ length: (19 - 7 + 1) * 4 }).map((_, i) => {
  const hours = Math.floor(i / 4) + 7;
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

export default function VehicleLogForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vehicles, setVehicles] = useState<ActiveVehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    vehicleId: "",
    initialKm: "",
    finalKm: "",
    startTime: "08:00",
    endTime: "17:00",
    route: "",
    notes: "",
    hasAnomaly: false,
    anomalyDescription: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles/active");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);
        }
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setFormData((prev) => ({
      ...prev,
      vehicleId,
      initialKm: vehicle ? vehicle.lastMileage.toString() : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic validation
    if (Number(formData.finalKm) < Number(formData.initialKm)) {
      setError("I km finali non possono essere inferiori ai km iniziali");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/vehicle-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            initialKm: Number(formData.initialKm),
            finalKm: Number(formData.finalKm),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Errore durante il salvataggio");
          return;
        }

        setSuccess("Registro salvato con successo!");
        setFormData({
          ...formData,
          initialKm: formData.finalKm, // Auto-set next initial km
          finalKm: "",
          route: "",
          notes: "",
          hasAnomaly: false,
          anomalyDescription: "",
        });
        router.refresh();
      } catch {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <h3 className="text-lg font-semibold text-foreground">Nuovo Registro</h3>
        <p className="text-sm text-muted-foreground">Compila i dettagli dell&apos;utilizzo del mezzo.</p>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Data
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            {/* Vehicle */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Veicolo
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  disabled={isLoadingVehicles}
                >
                  <option value="">Seleziona un veicolo...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} - {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* KM */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Km Iniziali
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.initialKm}
                  onChange={(e) => setFormData({ ...formData, initialKm: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Km Finali
              </label>
              <div className="relative">
                <Gauge className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.finalKm}
                  onChange={(e) => setFormData({ ...formData, finalKm: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Orario Partenza
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={`start-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Orario Fine
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={`end-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Tratta Percorsa
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                placeholder="Es. Sede -> Cliente X -> Sede"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
             <input
                type="checkbox"
                id="hasAnomaly"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.hasAnomaly}
                onChange={(e) => setFormData({ ...formData, hasAnomaly: e.target.checked })}
             />
             <label htmlFor="hasAnomaly" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
               Segnala Anomalia
             </label>
          </div>

          {formData.hasAnomaly && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium leading-none text-destructive">
                   Dettagli Anomalia
                </label>
                <div className="relative">
                   <AlertCircle className="absolute left-3 top-3 h-4 w-4 text-destructive" />
                   <textarea
                       required
                       className="flex min-h-[80px] w-full rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-destructive/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                       value={formData.anomalyDescription}
                       onChange={(e) => setFormData({ ...formData, anomalyDescription: e.target.value })}
                       placeholder="Descrivi il problema riscontrato..."
                   />
                </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
