"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
  X,
  Eye,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Vehicle = { id: string; plate: string; name: string };

type InsuranceDoc = {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  year: number | null;
  fileUrl: string;
  fileType: string;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
};

type Props = {
  vehicles: Vehicle[];
  documents: InsuranceDoc[];
};

function getStatusParams(dateStr: string | null) {
  if (!dateStr) return { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "N/D" };
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { color: "bg-destructive/10 text-destructive", label: "Scaduta" };
  if (diffDays < 30) return { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", label: "In Scadenza" };
  return { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Valida" };
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + 1 - i);

export default function InsurancesList({ vehicles, documents: initialDocuments }: Props) {
  const router = useRouter();
  const [documents, setDocuments] = useState<InsuranceDoc[]>(initialDocuments);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterVehicle, setFilterVehicle] = useState<string>("");

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    vehicleId: "",
    year: currentYear.toString(),
    expiryDate: "",
    notes: "",
    file: null as File | null,
  });

  // Edit modal
  const [editingDoc, setEditingDoc] = useState<InsuranceDoc | null>(null);
  const [editForm, setEditForm] = useState({ year: "", expiryDate: "", notes: "" });

  // View modal
  const [viewingDoc, setViewingDoc] = useState<InsuranceDoc | null>(null);

  const resetUploadForm = () =>
    setUploadForm({ vehicleId: "", year: currentYear.toString(), expiryDate: "", notes: "", file: null });

  const openEdit = (doc: InsuranceDoc) => {
    setEditingDoc(doc);
    setEditForm({
      year: doc.year ? doc.year.toString() : "",
      expiryDate: doc.expiryDate ? doc.expiryDate.split("T")[0] : "",
      notes: doc.notes ?? "",
    });
    setError(null);
  };

  // Derived: all years present in docs for filter dropdown
  const availableYears = useMemo(() => {
    const years = new Set(documents.map((d) => d.year).filter(Boolean) as number[]);
    return Array.from(years).sort((a, b) => b - a);
  }, [documents]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    return documents
      .filter((d) => {
        if (filterYear && d.year?.toString() !== filterYear) return false;
        if (filterVehicle && d.vehicleId !== filterVehicle) return false;
        return true;
      })
      .sort((a, b) => {
        // Expiring soonest first; null dates at end
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
  }, [documents, filterYear, filterVehicle]);

  /* ── upload ── */
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.vehicleId) return;
    setError(null);

    startTransition(async () => {
      try {
        const data = new FormData();
        data.append("file", uploadForm.file!);
        data.append("documentType", "ASSICURAZIONE");
        data.append("year", uploadForm.year);
        if (uploadForm.expiryDate) data.append("expiryDate", uploadForm.expiryDate);
        if (uploadForm.notes) data.append("notes", uploadForm.notes);

        const res = await fetch(`/api/vehicles/${uploadForm.vehicleId}/documents`, {
          method: "POST",
          body: data,
        });

        const result = await res.json();
        if (!res.ok) { setError(result.error || "Errore durante il caricamento"); return; }

        const vehicle = vehicles.find((v) => v.id === uploadForm.vehicleId)!;
        const newDoc: InsuranceDoc = {
          ...result,
          vehicle,
          expiryDate: result.expiryDate ? new Date(result.expiryDate).toISOString() : null,
          createdAt: new Date(result.createdAt).toISOString(),
        };

        setDocuments((prev) => [newDoc, ...prev]);
        setIsUploadOpen(false);
        resetUploadForm();
        router.refresh();
      } catch { setError("Si è verificato un errore imprevisto"); }
    });
  };

  /* ── edit ── */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/documents/${editingDoc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: editForm.year ? parseInt(editForm.year) : null,
            expiryDate: editForm.expiryDate || null,
            notes: editForm.notes || null,
            title: editForm.year ? `Assicurazione ${editForm.year}` : "Assicurazione",
          }),
        });

        const data = await res.json();
        if (!res.ok) { setError(data.error || "Errore durante il salvataggio"); return; }

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === editingDoc.id
              ? { ...d, year: data.year, expiryDate: data.expiryDate, notes: data.notes }
              : d
          )
        );
        setEditingDoc(null);
        router.refresh();
      } catch { setError("Si è verificato un errore imprevisto"); }
    });
  };

  /* ── delete ── */
  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo documento assicurativo?")) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
        if (!res.ok) { const data = await res.json(); alert(data.error || "Errore"); return; }
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        router.refresh();
      } catch { alert("Si è verificato un errore imprevisto"); }
    });
  };

  const selectClass = "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className={selectClass}
          >
            <option value="">Tutti gli anni</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className={selectClass}
          >
            <option value="">Tutti i mezzi</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plate} — {v.name}</option>
            ))}
          </select>
          {(filterYear || filterVehicle) && (
            <button
              onClick={() => { setFilterYear(""); setFilterVehicle(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Reimposta
            </button>
          )}
        </div>

        {/* Generic upload button */}
        <button
          onClick={() => { resetUploadForm(); setError(null); setIsUploadOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Carica Assicurazione
        </button>
      </div>

      {/* Summary table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Nessuna assicurazione trovata{filterYear || filterVehicle ? " con i filtri selezionati" : ""}.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Mezzo</th>
                  <th className="px-4 py-3 text-left font-medium">Anno</th>
                  <th className="px-4 py-3 text-left font-medium">Scadenza</th>
                  <th className="px-4 py-3 text-left font-medium">Stato</th>
                  <th className="px-4 py-3 text-left font-medium">Note</th>
                  <th className="px-4 py-3 text-right font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((doc) => {
                  const status = getStatusParams(doc.expiryDate);
                  return (
                    <tr key={doc.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold text-foreground">{doc.vehicle.plate}</p>
                            <p className="text-xs text-muted-foreground">{doc.vehicle.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {doc.year ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {doc.expiryDate
                          ? format(new Date(doc.expiryDate), "d MMM yyyy", { locale: it })
                          : <span className="text-muted-foreground">Non definita</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="truncate text-muted-foreground text-xs" title={doc.notes ?? ""}>
                          {doc.notes || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingDoc(doc)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                            title="Visualizza"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={doc.fileUrl}
                            download
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                            title="Scarica"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => openEdit(doc)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                            title="Modifica"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                            title="Elimina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl flex flex-col max-h-[calc(100vh-2rem)] my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Carica Assicurazione
              </h3>
              <button
                onClick={() => { setIsUploadOpen(false); setError(null); }}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Mezzo *</label>
                <select
                  required
                  value={uploadForm.vehicleId}
                  onChange={(e) => setUploadForm({ ...uploadForm, vehicleId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Seleziona un mezzo —</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate} — {v.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Anno *</label>
                  <select
                    required
                    value={uploadForm.year}
                    onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Data Scadenza</label>
                  <input
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">File (PDF o Immagine) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] ?? null })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Note</label>
                <textarea
                  rows={2}
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Note aggiuntive..."
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
                  onClick={() => { setIsUploadOpen(false); setError(null); }}
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isPending || !uploadForm.file || !uploadForm.vehicleId}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Carica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl flex flex-col max-h-[calc(100vh-2rem)] my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Modifica Assicurazione
              </h3>
              <button
                onClick={() => { setEditingDoc(null); setError(null); }}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                Mezzo:{" "}
                <span className="font-semibold text-foreground">
                  {editingDoc.vehicle.plate} — {editingDoc.vehicle.name}
                </span>
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Anno</label>
                  <select
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— N/D —</option>
                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Data Scadenza</label>
                  <input
                    type="date"
                    value={editForm.expiryDate}
                    onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  {editForm.expiryDate && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, expiryDate: "" })}
                      className="text-xs text-muted-foreground hover:text-destructive transition"
                    >
                      Rimuovi scadenza
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Note</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Note aggiuntive..."
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
                  onClick={() => { setEditingDoc(null); setError(null); }}
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
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl h-[85vh] flex flex-col rounded-xl bg-card shadow-2xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold">
                  {viewingDoc.year ? `Assicurazione ${viewingDoc.year}` : "Assicurazione"} — {viewingDoc.vehicle.plate}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {viewingDoc.expiryDate
                    ? `Scadenza: ${format(new Date(viewingDoc.expiryDate), "d MMMM yyyy", { locale: it })}`
                    : "Nessuna scadenza definita"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingDoc.fileUrl}
                  download
                  className="rounded-full p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                  title="Scarica"
                >
                  <Download className="h-5 w-5" />
                </a>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="rounded-full p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-muted/30 overflow-hidden flex items-center justify-center">
              {viewingDoc.fileType === "application/pdf" ? (
                <iframe src={viewingDoc.fileUrl} className="w-full h-full border-0" title="Documento" />
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingDoc.fileUrl}
                    alt="Documento assicurativo"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>
            {viewingDoc.notes && (
              <div className="p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Note:</span> {viewingDoc.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
