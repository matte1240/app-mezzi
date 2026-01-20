"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Truck, 
  Wrench, 
  Fuel, 
  LayoutDashboard, 
  Gauge,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  FileText,
  History,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addYears, isBefore, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import VehicleLogList from "./vehicle-log-list";
import VehicleMaintenance from "./vehicle-maintenance";
import VehicleRefueling from "./vehicle-refueling";
import VehicleDocuments from "./vehicle-documents";
import type { VehicleStatus } from "@/types/models";

type VehicleDetailsViewProps = {
  vehicle: {
    id: string;
    plate: string;
    name: string;
    type: string;
    status: VehicleStatus;
    notes: string | null;
    serviceIntervalKm: number;
    registrationDate?: Date | null;
  };
  stats: {
    lastMileage: number;
    totalLogs: number;
    lastUsageDate: string;
    lastUser: string | null;
  };
  logs: {
      id: string;
      date: string;
      initialKm: number;
      finalKm: number;
      startTime: string;
      endTime: string;
      route: string;
      user: {
        name: string | null;
        email: string;
      };
      vehicle: {
        plate: string;
        name: string;
      };
  }[];
  maintenance: {
      id: string;
      date: string;
      type: "TAGLIANDO" | "GOMME" | "MECCANICA" | "REVISIONE" | "ALTRO";
      cost: number | null;
      mileage: number;
      notes: string | null;
  }[];
  refueling: {
      id: string;
      date: string;
      liters: number;
      cost: number;
      mileage: number;
      notes: string | null;
  }[];
  documents: {
    id: string;
    documentType: "LIBRETTO_CIRCOLAZIONE" | "ASSICURAZIONE" | "ALTRO";
    title: string;
    year: number | null;
    fileUrl: string;
    fileType: string;
    expiryDate: string | null;
    notes: string | null;
    createdAt: string;
  }[];
};

export default function VehicleDetailsView({ 
  vehicle, 
  stats, 
  logs, 
  maintenance,
  refueling,
  documents
}: VehicleDetailsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "maintenance" | "refueling" | "documents">("overview");
  const [isKmModalOpen, setIsKmModalOpen] = useState(false);
  const [manualKm, setManualKm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // Trova l'ultima rilevazione manuale
  const lastManualLog = logs.find(log => log.route === "Rilevazione manuale KM");

  // Calculate maintenance status for the header/overview
  const lastService = maintenance.find(r => r.type === "TAGLIANDO");
  const lastServiceKm = lastService ? lastService.mileage : 0;
  const nextServiceKm = lastServiceKm + vehicle.serviceIntervalKm;
  const kmToNextService = nextServiceKm - stats.lastMileage;
  
  // Calculate next revision date
  let nextRevisionDate: Date | null = null;
  const lastRevision = maintenance.find(r => r.type === "REVISIONE");

  if (lastRevision) {
    nextRevisionDate = addYears(new Date(lastRevision.date), 2);
  } else if (vehicle.registrationDate) {
    const regDate = new Date(vehicle.registrationDate);
    let nextDate = addYears(regDate, 4);
    const today = new Date();
    
    // If the first 4-year deadline has passed, add 2 years until we find a future date
    // or the most recent past deadline
    while (isBefore(nextDate, today)) {
      nextDate = addYears(nextDate, 2);
    }
    nextRevisionDate = nextDate;
  }

  let maintenanceStatus = {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle,
    text: "Regolare"
  };

  if (kmToNextService < 0) {
    maintenanceStatus = {
      color: "text-destructive",
      bg: "bg-destructive/10",
      icon: AlertCircle,
      text: "Scaduto"
    };
  } else if (kmToNextService < 1000) {
    maintenanceStatus = {
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      icon: AlertTriangle,
      text: "In Scadenza"
    };
  }

  // Calculate Average Annual Mileage
  const calculateAverageAnnualMileage = () => {
    let startDate = vehicle.registrationDate ? new Date(vehicle.registrationDate) : null;
    
    // If no registration date, try to find the earliest record
    if (!startDate) {
      const dates: number[] = [];
      if (logs.length > 0) dates.push(new Date(logs[logs.length - 1].date).getTime());
      if (maintenance.length > 0) dates.push(new Date(maintenance[maintenance.length - 1].date).getTime());
      if (refueling.length > 0) dates.push(new Date(refueling[refueling.length - 1].date).getTime());
      
      if (dates.length > 0) {
        startDate = new Date(Math.min(...dates));
      }
    }

    if (!startDate) return 0;

    const daysDiff = differenceInDays(new Date(), startDate);
    if (daysDiff < 30) return stats.lastMileage; // Approximate to actual if less than a month

    const years = daysDiff / 365;
    return Math.round(stats.lastMileage / years);
  };

  // Calculate Average Consumption (L/100km)
  const calculateAverageConsumption = () => {
    if (refueling.length < 2) return null;

    // Sort by mileage ascending
    const sortedRefueling = [...refueling].sort((a, b) => a.mileage - b.mileage);
    
    const minKm = sortedRefueling[0].mileage;
    const maxKm = sortedRefueling[sortedRefueling.length - 1].mileage;
    const distance = maxKm - minKm;

    if (distance <= 0) return null;

    // Sum liters excluding the first record (which corresponds to consumption BEFORE the tracking start)
    // Actually, each refueling fills the tank for the PREVIOUS segment.
    // So if Record 1 (10000km, 50L) -> This 50L was used 0-10000km?? Or 5000-10000? 
    // Usually we assume full tank.
    // So Record 2 (10500km, 40L) -> 40L used for 10000-10500km.
    // We sum liters from index 1 to end (all records except the first one in chronological/mileage order).
    const totalLiters = sortedRefueling.slice(1).reduce((acc, curr) => acc + Number(curr.liters), 0);

    return (totalLiters / distance) * 100;
  };

  const avgAnnualMileage = calculateAverageAnnualMileage();
  const avgConsumption = calculateAverageConsumption();

  const handleSubmitKm = async (e: React.FormEvent, forceConfirm = false) => {
    e.preventDefault();
    setError(null);
    setWarning(null);

    const km = parseInt(manualKm);
    if (isNaN(km) || km <= 0) {
      setError("Inserisci un valore valido");
      return;
    }

    if (km < stats.lastMileage) {
      setError(`Il chilometraggio deve essere maggiore o uguale a ${stats.lastMileage} km`);
      return;
    }

    // Calcola la differenza dal chilometraggio attuale
    const difference = km - stats.lastMileage;
    
    // Controllo: differenza troppo bassa (< 10 km) o troppo alta (> 1000 km)
    if (!forceConfirm && !needsConfirmation) {
      if (difference < 10) {
        setWarning(`La differenza è molto bassa (${difference} km). Sei sicuro che il valore sia corretto?`);
        setNeedsConfirmation(true);
        return;
      }
      if (difference > 1000) {
        setWarning(`La differenza è molto alta (${difference.toLocaleString('it-IT')} km). Sei sicuro che il valore sia corretto?`);
        setNeedsConfirmation(true);
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/vehicle-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            date: new Date().toISOString(),
            initialKm: stats.lastMileage,
            finalKm: km,
            startTime: "00:00",
            endTime: "00:00",
            route: "Rilevazione manuale KM",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Errore durante il salvataggio");
        }

        setIsKmModalOpen(false);
        setManualKm("");
        setNeedsConfirmation(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore sconosciuto");
      }
    });
  };

  const handleDeleteLastManualLog = async () => {
    if (!lastManualLog) return;
    
    if (!confirm("Sei sicuro di voler eliminare l'ultima rilevazione manuale?")) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/vehicle-logs?id=${lastManualLog.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          let errorMessage = "Errore durante l'eliminazione";
          try {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // La risposta non è JSON, usa il messaggio di default
          }
          throw new Error(errorMessage);
        }

        setIsKmModalOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore sconosciuto");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Truck className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{vehicle.plate}</h1>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  vehicle.status === "ACTIVE" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  vehicle.status === "MAINTENANCE" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                  vehicle.status === "OUT_OF_SERVICE" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {vehicle.status === "ACTIVE" && "Attivo"}
                  {vehicle.status === "MAINTENANCE" && "In Manutenzione"}
                  {vehicle.status === "OUT_OF_SERVICE" && "Fuori Servizio"}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">
                {vehicle.name} • {vehicle.type}
              </p>
              {vehicle.notes && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                  {vehicle.notes}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className={cn("px-4 py-2 rounded-lg flex items-center gap-2", maintenanceStatus.bg, maintenanceStatus.color)}>
              <maintenanceStatus.icon className="h-4 w-4" />
              <span className="text-sm font-semibold">Tagliando: {maintenanceStatus.text}</span>
            </div>
            <button
              onClick={() => {
                setManualKm(stats.lastMileage.toString());
                setError(null);
                setIsKmModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Gauge className="h-4 w-4" />
              <span className="text-sm font-semibold">Rileva KM</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Chilometraggio</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.lastMileage.toLocaleString('it-IT')} km</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Prossima Revisione</p>
            <p className={cn(
              "text-lg font-semibold mt-1",
              nextRevisionDate && isBefore(nextRevisionDate, new Date()) 
                ? "text-destructive" 
                : "text-foreground"
            )}>
              {nextRevisionDate 
                ? format(nextRevisionDate, "dd/MM/yyyy") 
                : "N/D"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Prossimo Tagliando</p>
            <p className={cn(
              "text-2xl font-bold mt-1",
              kmToNextService < 0 ? "text-destructive" : "text-foreground"
            )}>
              {kmToNextService >= 0 
                ? `Fra ${kmToNextService.toLocaleString('it-IT')} km`
                : `Scaduto da ${Math.abs(kmToNextService).toLocaleString('it-IT')} km`
              }
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Medio Annuo</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {avgAnnualMileage.toLocaleString('it-IT')} km
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Consumo Medio</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {avgConsumption ? `${avgConsumption.toFixed(1)} L/100km` : "N/D"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Panoramica
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === "logs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <History className="h-4 w-4" />
            Storico Viaggi
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === "maintenance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <Wrench className="h-4 w-4" />
            Manutenzione
          </button>
          <button
            onClick={() => setActiveTab("refueling")}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === "refueling"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <Fuel className="h-4 w-4" />
            Rifornimenti
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === "documents"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4" />
            Documenti
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-muted-foreground" />
                    Ultimi Rifornimenti
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {refueling.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Fuel className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(record.date), "dd MMMM yyyy", { locale: it })}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Gauge className="h-3 w-3" />
                            {record.mileage} km
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {Number(record.liters).toFixed(2)} L
                        </p>
                        <p className="text-xs text-muted-foreground">
                          € {Number(record.cost).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {refueling.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      Nessun rifornimento recente
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    Ultimi Interventi
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {maintenance.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <Wrench className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">
                            {record.type.toLowerCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.date), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {record.mileage} km
                        </p>
                        {record.cost && (
                          <p className="text-xs text-muted-foreground">
                            € {record.cost.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {maintenance.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      Nessun intervento registrato
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <VehicleLogList logs={logs} />
        )}

        {activeTab === "maintenance" && (
          <VehicleMaintenance 
            vehicleId={vehicle.id}
            currentMileage={stats.lastMileage}
            serviceIntervalKm={vehicle.serviceIntervalKm}
            initialRecords={maintenance}
          />
        )}

        {activeTab === "refueling" && (
          <VehicleRefueling 
            vehicleId={vehicle.id}
            currentMileage={stats.lastMileage}
            initialRecords={refueling}
          />
        )}

        {activeTab === "documents" && (
          <VehicleDocuments 
            vehicleId={vehicle.id}
            initialDocuments={documents}
          />
        )}
      </div>

      {/* Modal Rileva KM */}
      {isKmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-card shadow-2xl border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Gauge className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Rileva Chilometraggio</h3>
              </div>
              <button
                onClick={() => {
                  setIsKmModalOpen(false);
                  setError(null);
                }}
                className="rounded-full p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSubmitKm(e, needsConfirmation)} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {warning && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</p>
                </div>
              )}

              {lastManualLog && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Ultima rilevazione manuale</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {lastManualLog.finalKm.toLocaleString('it-IT')} km - {format(new Date(lastManualLog.date), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteLastManualLog}
                      disabled={isPending}
                      className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Chilometraggio Attuale
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={manualKm}
                    onChange={(e) => {
                      setManualKm(e.target.value);
                      setWarning(null);
                      setNeedsConfirmation(false);
                    }}
                    min={stats.lastMileage}
                    step="1"
                    required
                    disabled={isPending}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg font-semibold ring-offset-background outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    placeholder="Inserisci KM"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    km
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ultimo rilevamento: {stats.lastMileage.toLocaleString('it-IT')} km
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsKmModalOpen(false);
                    setError(null);
                    setWarning(null);
                    setNeedsConfirmation(false);
                  }}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-lg border border-input bg-background hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                    needsConfirmation 
                      ? "bg-yellow-600 dark:bg-yellow-500 text-white hover:bg-yellow-700 dark:hover:bg-yellow-600"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {needsConfirmation ? "Conferma comunque" : "Salva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
