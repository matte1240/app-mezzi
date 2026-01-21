"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Wrench, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X,
  Edit,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

type MaintenanceRecord = {
  id: string;
  date: string;
  type: "TAGLIANDO" | "GOMME" | "MECCANICA" | "REVISIONE" | "ALTRO";
  cost: number | null;
  mileage: number;
  notes: string | null;
  tireType?: "ESTIVE" | "INVERNALI" | "QUATTRO_STAGIONI" | null;
  tireStorageLocation?: string | null;
};

type VehicleMaintenanceProps = {
  vehicleId: string;
  currentMileage: number;
  serviceIntervalKm: number;
  initialRecords: MaintenanceRecord[];
  activeAnomalies?: {
      id: string;
      date: string;
      description: string;
      reporter: string;
  }[];
};

export default function VehicleMaintenance({ 
  vehicleId, 
  currentMileage, 
  serviceIntervalKm, 
  initialRecords,
  activeAnomalies = []
}: VehicleMaintenanceProps) {
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>(initialRecords);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Calculate next service
  const lastService = records.find(r => r.type === "TAGLIANDO");
  const lastServiceKm = lastService ? lastService.mileage : 0;
  const nextServiceKm = lastServiceKm + serviceIntervalKm;
  const kmToNextService = nextServiceKm - currentMileage;
  
  // Determine status
  let statusColor = "text-emerald-600 dark:text-emerald-400";
  let statusBg = "bg-emerald-100 dark:bg-emerald-900/30";
  let StatusIcon = CheckCircle;
  let statusText = "Regolare";

  if (kmToNextService < 0) {
    statusColor = "text-destructive";
    statusBg = "bg-destructive/10";
    StatusIcon = AlertCircle;
    statusText = "Scaduto";
  } else if (kmToNextService < 1000) {
    statusColor = "text-yellow-600 dark:text-yellow-400";
    statusBg = "bg-yellow-100 dark:bg-yellow-900/30";
    StatusIcon = AlertTriangle;
    statusText = "In Scadenza";
  }

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "TAGLIANDO",
    cost: "",
    mileage: currentMileage,
    notes: "",
    tireType: "",
    tireStorageLocation: "",
    resolvedAnomalyIds: [] as string[]
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      type: "TAGLIANDO",
      cost: "",
      mileage: currentMileage,
      notes: "",
      tireType: "",
      tireStorageLocation: "",
      resolvedAnomalyIds: []
    });
    setEditingRecord(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setFormData({
      date: format(new Date(record.date), "yyyy-MM-dd"),
      type: record.type as string,
      cost: record.cost ? record.cost.toString() : "",
      mileage: record.mileage,
      notes: record.notes || "",
      tireType: record.tireType || "",
      tireStorageLocation: record.tireStorageLocation || "",
      resolvedAnomalyIds: []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo intervento?")) return;
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/maintenance/${id}`, {
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
          ? `/api/maintenance/${editingRecord.id}`
          : `/api/vehicles/${vehicleId}/maintenance`;
        
        const method = editingRecord ? "PUT" : "POST";

        const payload: Record<string, unknown> = {
          date: formData.date,
          type: formData.type,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          resolvedAnomalyIds: formData.resolvedAnomalyIds,
          mileage: Number(formData.mileage),
          notes: formData.notes || undefined,
        };

        // Includi campi gomme solo se il tipo è GOMME
        if (formData.type === "GOMME") {
          payload.tireType = formData.tireType || undefined;
          // Includi tireStorageLocation solo se non è vuoto e non sono 4 stagioni
          if (formData.tireType !== "QUATTRO_STAGIONI" && formData.tireStorageLocation?.trim()) {
            payload.tireStorageLocation = formData.tireStorageLocation.trim();
          }
        }

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Errore durante il salvataggio");
          return;
        }

        // Add new record or update existing and resort
        const savedRecord = {
            ...data,
            date: data.date // Ensure date format matches
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
          <Wrench className="h-5 w-5" />
          Manutenzione
        </h3>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Registra Intervento
        </button>
      </div>

      {/* Status Card */}
      <div className={cn("rounded-xl border p-6 flex items-center justify-between", statusBg, "border-transparent")}>
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full bg-background/50", statusColor)}>
            <StatusIcon className="h-6 w-6" />
          </div>
          <div>
            <p className={cn("font-semibold", statusColor)}>Stato Manutenzione: {statusText}</p>
            <p className="text-sm text-muted-foreground">
              Prossimo tagliando tra <strong>{kmToNextService} km</strong> (a {nextServiceKm} km)
            </p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Km</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nessun intervento registrato.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr 
                    key={record.id} 
                    onClick={() => openEditModal(record)}
                    className="transition hover:bg-muted/50 group cursor-pointer"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                      {format(new Date(record.date), "dd/MM/yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {record.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {record.mileage} km
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {record.cost ? `€ ${Number(record.cost).toFixed(2)}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs">
                      {record.type === "GOMME" && record.tireType ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex rounded bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                              {record.tireType === "ESTIVE" && "Estive"}
                              {record.tireType === "INVERNALI" && "Invernali"}
                              {record.tireType === "QUATTRO_STAGIONI" && "4 Stagioni"}
                            </span>
                          </div>
                          {record.tireStorageLocation && (
                            <div className="text-xs text-muted-foreground">
                              📍 {record.tireStorageLocation}
                            </div>
                          )}
                          {record.notes && (
                            <div className="text-xs truncate">{record.notes}</div>
                          )}
                        </div>
                      ) : (
                        <span className="truncate block">{record.notes || "-"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(record);
                          }}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          title="Modifica"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(record.id);
                          }}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
            <div className="border-b border-border bg-primary px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-foreground">
                  {editingRecord ? "Modifica Intervento" : "Registra Intervento"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-primary-foreground/80 transition hover:bg-primary-foreground/20 hover:text-primary-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              
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
                  <label className="block text-sm font-semibold text-foreground mb-2">Tipo</label>
                  <select
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="TAGLIANDO">Tagliando</option>
                    <option value="GOMME">Gomme</option>
                    <option value="MECCANICA">Meccanica</option>
                    <option value="REVISIONE">Revisione</option>
                    <option value="ALTRO">Altro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Km al momento</label>
                  <input
                    type="number"
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Costo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Note</label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Dettagli intervento..."
                />
              </div>

              {/* Campi specifici per cambio gomme */}
              {formData.type === "GOMME" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Tipo Gomme *
                    </label>
                    <select
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={formData.tireType}
                      onChange={(e) => setFormData({ ...formData, tireType: e.target.value, tireStorageLocation: e.target.value === "QUATTRO_STAGIONI" ? "" : formData.tireStorageLocation })}
                      required
                    >
                      <option value="">Seleziona tipo...</option>
                      <option value="ESTIVE">Estive</option>
                      <option value="INVERNALI">Invernali</option>
                      <option value="QUATTRO_STAGIONI">4 Stagioni</option>
                    </select>
                  </div>

                  {formData.tireType && formData.tireType !== "QUATTRO_STAGIONI" && (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Dove sono le gomme smontate?
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={formData.tireStorageLocation}
                        onChange={(e) => setFormData({ ...formData, tireStorageLocation: e.target.value })}
                        placeholder="Es: Garage, Gommista Mario, etc."
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingRecord ? "Salva Modifiche" : "Aggiungi Intervento"}
                </button>
              </div>

              {!editingRecord && activeAnomalies.length > 0 && (
                <div className="border-t border-border pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Risolvi Anomalie Segnalate
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto bg-muted/30 p-2 rounded-lg border border-border">
                        {activeAnomalies.map(anomaly => (
                            <label key={anomaly.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.resolvedAnomalyIds.includes(anomaly.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData(prev => ({ ...prev, resolvedAnomalyIds: [...prev.resolvedAnomalyIds, anomaly.id] }));
                                        } else {
                                            setFormData(prev => ({ ...prev, resolvedAnomalyIds: prev.resolvedAnomalyIds.filter(id => id !== anomaly.id) }));
                                        }
                                    }}
                                />
                                <div className="text-sm">
                                    <p className="font-medium text-foreground">{anomaly.description}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(anomaly.date), "dd/MM/yyyy")} - {anomaly.reporter}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}