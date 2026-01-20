"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Truck,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleStatus } from "@/types/models";

type ManageVehiclesProps = {
  vehicles: (Vehicle & { lastMileage: number; lastServiceKm: number })[];
};

type VehicleForm = {
  plate: string;
  name: string;
  type: string;
  status: VehicleStatus;
  notes: string;
  serviceIntervalKm: number;
  registrationDate: string;
};

const initialFormState: VehicleForm = {
  plate: "",
  name: "",
  type: "",
  status: "ACTIVE",
  notes: "",
  serviceIntervalKm: 15000,
  registrationDate: "",
};

export default function ManageVehicles({ vehicles }: ManageVehiclesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  // Form states
  const [formData, setFormData] = useState<VehicleForm>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setFormData(initialFormState);
    setError(null);
    setSuccess(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Errore durante la creazione del veicolo");
          return;
        }

        setSuccess("Veicolo creato con successo");
        router.refresh();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          resetForm();
        }, 1500);
      } catch {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/vehicles/${editingVehicle.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Errore durante l'aggiornamento del veicolo");
          return;
        }

        setSuccess("Veicolo aggiornato con successo");
        router.refresh();
        setTimeout(() => {
          setEditingVehicle(null);
          resetForm();
        }, 1500);
      } catch {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/vehicles/${deletingVehicle.id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Errore durante l'eliminazione del veicolo");
          return;
        }

        router.refresh();
        setDeletingVehicle(null);
      } catch {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };

  const openEditModal = (vehicle: Vehicle & { registrationDate?: Date | null }) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate: vehicle.plate,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      notes: vehicle.notes || "",
      serviceIntervalKm: vehicle.serviceIntervalKm || 15000,
      registrationDate: vehicle.registrationDate ? new Date(vehicle.registrationDate).toISOString().split('T')[0] : "",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:px-12 md:py-8 pt-6">
      {/* Header with Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestione Mezzi
          </h2>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Nuovo Veicolo
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Vehicles Table */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Targa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome/Modello
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Km Attuali
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stato
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Note
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nessun veicolo presente.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => {
                  const nextServiceKm = vehicle.lastServiceKm + (vehicle.serviceIntervalKm || 15000);
                  const kmToNextService = nextServiceKm - vehicle.lastMileage;
                  const isOverdue = kmToNextService < 0;
                  const isWarning = kmToNextService < 1500 && !isOverdue;

                  return (
                  <tr 
                    key={vehicle.id} 
                    className="transition hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground overflow-hidden">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold text-foreground">{vehicle.plate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {vehicle.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {vehicle.type}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                      {vehicle.lastMileage.toLocaleString('it-IT')} km
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {vehicle.status === "ACTIVE" && isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          Tagliando Scaduto
                        </span>
                      ) : vehicle.status === "ACTIVE" && isWarning ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <AlertTriangle className="h-3 w-3" />
                          Tagliando Vicino
                        </span>
                      ) : (
                        <span className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          vehicle.status === "ACTIVE" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          vehicle.status === "MAINTENANCE" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                          vehicle.status === "OUT_OF_SERVICE" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {vehicle.status === "ACTIVE" && "Attivo"}
                          {vehicle.status === "MAINTENANCE" && "In Manutenzione"}
                          {vehicle.status === "OUT_OF_SERVICE" && "Fuori Servizio"}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground truncate max-w-[200px]">
                      {vehicle.notes}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 cursor-pointer"
                          title="Visualizza dettaglio"
                        >
                          <History className="h-4 w-4" />
                          Dettaglio
                        </button>
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 cursor-pointer"
                          title="Modifica veicolo"
                        >
                          <Edit className="h-4 w-4" />
                          Modifica
                        </button>
                        <button
                          onClick={() => setDeletingVehicle(vehicle)}
                          className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/20 cursor-pointer"
                          title="Elimina veicolo"
                        >
                          <Trash2 className="h-4 w-4" />
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
            <div className="border-b border-border bg-primary px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-foreground">Nuovo Veicolo</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg p-1 text-primary-foreground/80 transition hover:bg-primary-foreground/20 hover:text-primary-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Targa</label>
                <input
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                  placeholder="AB123CD"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Nome/Modello</label>
                <input
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Fiat Ducato"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Tipo</label>
                  <input
                    required
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Furgone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Stato</label>
                  <select
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                  >
                    <option value="ACTIVE">Attivo</option>
                    <option value="MAINTENANCE">In Manutenzione</option>
                    <option value="OUT_OF_SERVICE">Fuori Servizio</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Note</label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Note aggiuntive..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Intervallo Tagliando (km)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.serviceIntervalKm}
                  onChange={(e) => setFormData({ ...formData, serviceIntervalKm: parseInt(e.target.value) || 0 })}
                  placeholder="15000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Data Immatricolazione</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.registrationDate}
                  onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
                  Crea Veicolo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl">
            <div className="border-b border-border bg-primary px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-foreground">Modifica Veicolo</h2>
                <button
                  onClick={() => setEditingVehicle(null)}
                  className="rounded-lg p-1 text-primary-foreground/80 transition hover:bg-primary-foreground/20 hover:text-primary-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Targa</label>
                <input
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Nome/Modello</label>
                <input
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Tipo</label>
                  <input
                    required
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Stato</label>
                  <select
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                  >
                    <option value="ACTIVE">Attivo</option>
                    <option value="MAINTENANCE">In Manutenzione</option>
                    <option value="OUT_OF_SERVICE">Fuori Servizio</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Note</label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Intervallo Tagliando (km)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.serviceIntervalKm}
                  onChange={(e) => setFormData({ ...formData, serviceIntervalKm: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Data Immatricolazione</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={formData.registrationDate}
                  onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
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
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Elimina Veicolo</h3>
                <p className="text-sm text-muted-foreground">
                  Sei sicuro di voler eliminare il veicolo <strong>{deletingVehicle.plate}</strong>?
                  Questa azione non può essere annullata.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setDeletingVehicle(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-destructive px-6 py-2 text-sm font-semibold text-destructive-foreground shadow-md transition hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
