"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Wrench,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Vehicle = { id: string; plate: string; name: string };

type MaintenanceItem = {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  date: string;
  type: MaintenanceType;
  cost: number | null;
  mileage: number;
  notes: string | null;
  tireType: TireType | null;
  tireStorageLocation: string | null;
  createdAt: string;
  updatedAt: string;
};

type MaintenanceType = "TAGLIANDO" | "GOMME" | "MECCANICA" | "REVISIONE" | "ALTRO";
type TireType = "ESTIVE" | "INVERNALI" | "QUATTRO_STAGIONI";

type Props = {
  vehicles: Vehicle[];
  items: MaintenanceItem[];
};

const TYPE_LABELS: Record<MaintenanceType, string> = {
  TAGLIANDO: "Tagliando",
  GOMME: "Cambio Gomme",
  MECCANICA: "Meccanica",
  REVISIONE: "Revisione",
  ALTRO: "Altro",
};

const TIRE_LABELS: Record<TireType, string> = {
  ESTIVE: "Estive",
  INVERNALI: "Invernali",
  QUATTRO_STAGIONI: "4 Stagioni",
};

const TYPE_COLORS: Record<MaintenanceType, string> = {
  TAGLIANDO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  GOMME: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  MECCANICA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  REVISIONE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  ALTRO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + 1 - i);

const emptyForm = {
  vehicleId: "",
  date: new Date().toISOString().split("T")[0],
  type: "" as MaintenanceType | "",
  cost: "",
  mileage: "",
  notes: "",
  tireType: "" as TireType | "",
  tireStorageLocation: "",
};

export default function MaintenanceList({ vehicles, items: initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<MaintenanceItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterVehicle, setFilterVehicle] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });

  // Edit modal
  const [editingItem, setEditingItem] = useState<MaintenanceItem | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const resetAddForm = () => setAddForm({ ...emptyForm });

  const openEdit = (item: MaintenanceItem) => {
    setEditingItem(item);
    setEditForm({
      vehicleId: item.vehicleId,
      date: item.date.split("T")[0],
      type: item.type,
      cost: item.cost != null ? item.cost.toString() : "",
      mileage: item.mileage.toString(),
      notes: item.notes ?? "",
      tireType: item.tireType ?? "",
      tireStorageLocation: item.tireStorageLocation ?? "",
    });
    setError(null);
  };

  // Derived: available years from dates
  const availableYears = useMemo(() => {
    const years = new Set(items.map((i) => new Date(i.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  // Filtered list
  const filtered = useMemo(() => {
    return items
      .filter((i) => {
        if (filterYear && new Date(i.date).getFullYear().toString() !== filterYear) return false;
        if (filterVehicle && i.vehicleId !== filterVehicle) return false;
        if (filterType && i.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [items, filterYear, filterVehicle, filterType]);

  /* ─── create ─── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.vehicleId || !addForm.type || !addForm.mileage) return;
    setError(null);

    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          date: addForm.date,
          type: addForm.type,
          mileage: parseInt(addForm.mileage),
          cost: addForm.cost ? parseFloat(addForm.cost) : undefined,
          notes: addForm.notes || undefined,
        };
        if (addForm.type === "GOMME" && addForm.tireType) {
          body.tireType = addForm.tireType;
          if (addForm.tireType !== "QUATTRO_STAGIONI" && addForm.tireStorageLocation) {
            body.tireStorageLocation = addForm.tireStorageLocation;
          }
        }

        const res = await fetch(`/api/vehicles/${addForm.vehicleId}/maintenance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) { setError(data.error || "Errore durante il salvataggio"); return; }

        const vehicle = vehicles.find((v) => v.id === addForm.vehicleId)!;
        const newItem: MaintenanceItem = {
          ...data,
          vehicle,
          date: new Date(data.date).toISOString(),
          createdAt: new Date(data.createdAt).toISOString(),
          updatedAt: new Date(data.updatedAt).toISOString(),
          cost: data.cost != null ? parseFloat(data.cost) : null,
          tireType: data.tireType ?? null,
          tireStorageLocation: data.tireStorageLocation ?? null,
        };

        setItems((prev) => [newItem, ...prev]);
        setIsAddOpen(false);
        resetAddForm();
        router.refresh();
      } catch { setError("Si è verificato un errore imprevisto"); }
    });
  };

  /* ─── edit ─── */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editForm.type || !editForm.mileage) return;
    setError(null);

    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          date: editForm.date,
          type: editForm.type,
          mileage: parseInt(editForm.mileage),
          cost: editForm.cost ? parseFloat(editForm.cost) : undefined,
          notes: editForm.notes || undefined,
        };
        if (editForm.type === "GOMME" && editForm.tireType) {
          body.tireType = editForm.tireType;
          if (editForm.tireType !== "QUATTRO_STAGIONI" && editForm.tireStorageLocation) {
            body.tireStorageLocation = editForm.tireStorageLocation;
          }
        }

        const res = await fetch(`/api/maintenance/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) { setError(data.error || "Errore durante il salvataggio"); return; }

        setItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id
              ? {
                  ...i,
                  date: new Date(data.date).toISOString(),
                  type: data.type,
                  cost: data.cost != null ? parseFloat(data.cost) : null,
                  mileage: data.mileage,
                  notes: data.notes ?? null,
                  tireType: data.tireType ?? null,
                  tireStorageLocation: data.tireStorageLocation ?? null,
                }
              : i
          )
        );
        setEditingItem(null);
        router.refresh();
      } catch { setError("Si è verificato un errore imprevisto"); }
    });
  };

  /* ─── delete ─── */
  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo intervento?")) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
        if (!res.ok) { const d = await res.json(); alert(d.error || "Errore"); return; }
        setItems((prev) => prev.filter((i) => i.id !== id));
        router.refresh();
      } catch { alert("Si è verificato un errore imprevisto"); }
    });
  };

  const selectCls = "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={selectCls}>
            <option value="">Tutti gli anni</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className={selectCls}>
            <option value="">Tutti i mezzi</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.name}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
            <option value="">Tutti i tipi</option>
            {(Object.keys(TYPE_LABELS) as MaintenanceType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          {(filterYear || filterVehicle || filterType) && (
            <button
              onClick={() => { setFilterYear(""); setFilterVehicle(""); setFilterType(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Reimposta
            </button>
          )}
        </div>

        <button
          onClick={() => { resetAddForm(); setError(null); setIsAddOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Aggiungi Manutenzione
        </button>
      </div>

      {/* Summary count */}
      {(filterYear || filterVehicle || filterType) && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} interventi trovati
        </p>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Nessuna manutenzione trovata{filterYear || filterVehicle || filterType ? " con i filtri selezionati" : ""}.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Mezzo</th>
                  <th className="px-4 py-3 text-left font-medium">Data</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Km</th>
                  <th className="px-4 py-3 text-left font-medium">Costo</th>
                  <th className="px-4 py-3 text-left font-medium">Note</th>
                  <th className="px-4 py-3 text-right font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">{item.vehicle.plate}</p>
                          <p className="text-xs text-muted-foreground">{item.vehicle.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(item.date), "d MMM yyyy", { locale: it })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <Badge variant="secondary" className={cn("text-xs", TYPE_COLORS[item.type])}>
                          {TYPE_LABELS[item.type]}
                        </Badge>
                        {item.tireType && (
                          <p className="text-xs text-muted-foreground">{TIRE_LABELS[item.tireType]}</p>
                        )}
                        {item.tireStorageLocation && (
                          <p className="text-xs text-muted-foreground italic">{item.tireStorageLocation}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.mileage.toLocaleString()} km
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {item.cost != null
                        ? `€ ${item.cost.toFixed(2)}`
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate text-muted-foreground text-xs" title={item.notes ?? ""}>
                        {item.notes || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                          title="Modifica"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Modal ── */}
      {isAddOpen && (
        <MaintenanceModal
          title="Aggiungi Manutenzione"
          form={addForm}
          vehicles={vehicles}
          showVehicleSelect
          isPending={isPending}
          error={error}
          onChange={(f) => setAddForm(f)}
          onSubmit={handleCreate}
          onClose={() => { setIsAddOpen(false); setError(null); }}
          submitLabel="Aggiungi"
          inputCls={inputCls}
        />
      )}

      {/* ── Edit Modal ── */}
      {editingItem && (
        <MaintenanceModal
          title="Modifica Manutenzione"
          form={editForm}
          vehicles={vehicles}
          showVehicleSelect={false}
          vehicleName={`${editingItem.vehicle.plate} — ${editingItem.vehicle.name}`}
          isPending={isPending}
          error={error}
          onChange={(f) => setEditForm(f)}
          onSubmit={handleEdit}
          onClose={() => { setEditingItem(null); setError(null); }}
          submitLabel="Salva Modifiche"
          inputCls={inputCls}
        />
      )}
    </div>
  );
}

/* ── Shared Form Modal ── */
type FormState = {
  vehicleId: string;
  date: string;
  type: MaintenanceType | "";
  cost: string;
  mileage: string;
  notes: string;
  tireType: TireType | "";
  tireStorageLocation: string;
};

function MaintenanceModal({
  title,
  form,
  vehicles,
  showVehicleSelect,
  vehicleName,
  isPending,
  error,
  onChange,
  onSubmit,
  onClose,
  submitLabel,
  inputCls,
}: {
  title: string;
  form: FormState;
  vehicles: Vehicle[];
  showVehicleSelect: boolean;
  vehicleName?: string;
  isPending: boolean;
  error: string | null;
  onChange: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitLabel: string;
  inputCls: string;
}) {
  const set = (patch: Partial<FormState>) => onChange({ ...form, ...patch });
  const isGomme = form.type === "GOMME";
  const showStorage = isGomme && form.tireType !== "" && form.tireType !== "QUATTRO_STAGIONI";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-xl flex flex-col max-h-[calc(100vh-2rem)] my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {title}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Vehicle selector or label */}
          {showVehicleSelect ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Mezzo *</label>
              <select
                required
                value={form.vehicleId}
                onChange={(e) => set({ vehicleId: e.target.value })}
                className={inputCls}
              >
                <option value="">— Seleziona un mezzo —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Mezzo: <span className="font-semibold text-foreground">{vehicleName}</span>
            </p>
          )}

          {/* Date + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Data *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Tipo *</label>
              <select
                required
                value={form.type}
                onChange={(e) => set({ type: e.target.value as MaintenanceType, tireType: "", tireStorageLocation: "" })}
                className={inputCls}
              >
                <option value="">— Seleziona —</option>
                <option value="TAGLIANDO">Tagliando</option>
                <option value="GOMME">Cambio Gomme</option>
                <option value="MECCANICA">Meccanica</option>
                <option value="REVISIONE">Revisione</option>
                <option value="ALTRO">Altro</option>
              </select>
            </div>
          </div>

          {/* Tire-specific fields */}
          {isGomme && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Tipo Gomme</label>
                <select
                  value={form.tireType}
                  onChange={(e) => set({ tireType: e.target.value as TireType | "", tireStorageLocation: "" })}
                  className={inputCls}
                >
                  <option value="">— Seleziona —</option>
                  <option value="ESTIVE">Estive</option>
                  <option value="INVERNALI">Invernali</option>
                  <option value="QUATTRO_STAGIONI">4 Stagioni</option>
                </select>
              </div>
              {showStorage && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Deposito Gomme</label>
                  <input
                    type="text"
                    value={form.tireStorageLocation}
                    onChange={(e) => set({ tireStorageLocation: e.target.value })}
                    placeholder="Dove sono le gomme smontate..."
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          )}

          {/* Mileage + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Chilometri *</label>
              <input
                type="number"
                required
                min={0}
                value={form.mileage}
                onChange={(e) => set({ mileage: e.target.value })}
                placeholder="es. 125000"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Costo (€)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.cost}
                onChange={(e) => set({ cost: e.target.value })}
                placeholder="es. 250.00"
                className={inputCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Note</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Note aggiuntive..."
              className={inputCls}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
