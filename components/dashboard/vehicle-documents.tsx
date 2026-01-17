"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  FileText, 
  Plus, 
  Loader2,
  Trash2,
  Download,
  AlertCircle,
  File
} from "lucide-react";
import { cn } from "@/lib/utils";

type VehicleDocument = {
  id: string;
  documentType: "LIBRETTO_CIRCOLAZIONE" | "ASSICURAZIONE" | "ALTRO";
  title: string;
  year: number | null;
  fileUrl: string;
  fileType: string;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
};

type VehicleDocumentsProps = {
  vehicleId: string;
  initialDocuments: VehicleDocument[];
};

export default function VehicleDocuments({ 
  vehicleId, 
  initialDocuments 
}: VehicleDocumentsProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocuments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VehicleDocument | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    documentType: "ALTRO" as "LIBRETTO_CIRCOLAZIONE" | "ASSICURAZIONE" | "ALTRO",
    title: "",
    year: new Date().getFullYear().toString(),
    notes: "",
    expiryDate: "",
    file: null as File | null
  });

  const resetForm = () => {
    setFormData({
      documentType: "ALTRO",
      title: "",
      year: new Date().getFullYear().toString(),
      notes: "",
      expiryDate: "",
      file: null
    });
    setError(null);
  };

  const getDocumentTypeLabel = (type: string) => {
    switch(type) {
      case "LIBRETTO_CIRCOLAZIONE":
        return "Libretto di circolazione";
      case "ASSICURAZIONE":
        return "Assicurazione";
      case "ALTRO":
        return "Altro";
      default:
        return type;
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo documento permanentemente?")) return;
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Errore durante l'eliminazione");
          return;
        }

        setDocuments(prev => prev.filter(d => d.id !== id));
        router.refresh();
      } catch {
        alert("Si è verificato un errore imprevisto");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fileToUpload = formData.file;

    if (!fileToUpload) {
      setError("Seleziona un file da caricare");
      return;
    }

    startTransition(async () => {
      try {
        const data = new FormData();
        data.append("file", fileToUpload);
        data.append("documentType", formData.documentType);
        
        // Invia title solo per ALTRO
        if (formData.documentType === "ALTRO") {
          data.append("title", formData.title);
        }
        
        // Invia year solo per ASSICURAZIONE
        if (formData.documentType === "ASSICURAZIONE") {
          data.append("year", formData.year);
        }
        
        if (formData.notes) data.append("notes", formData.notes);
        if (formData.expiryDate) data.append("expiryDate", formData.expiryDate);

        const res = await fetch(`/api/vehicles/${vehicleId}/documents`, {
          method: "POST",
          body: data,
        });

        const result = await res.json();

        if (!res.ok) {
          setError(result.error || "Errore durante il caricamento");
          return;
        }

        setDocuments(prev => [result, ...prev]);
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
          <FileText className="h-5 w-5" />
          Documenti
        </h3>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Carica Documento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.length === 0 ? (
           <div className="col-span-full border rounded-xl p-8 text-center text-muted-foreground bg-card">
             Nessun documento presente per questo veicolo.
           </div>
        ) : (
          documents.map((doc) => (
            <div 
              key={doc.id} 
              onClick={() => setSelectedDoc(doc)}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground line-clamp-1" title={doc.title}>
                      {doc.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {getDocumentTypeLabel(doc.documentType)}
                      {doc.documentType === "ASSICURAZIONE" && doc.year && ` (${doc.year})`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Caricato il {format(new Date(doc.createdAt), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                   <a
                     href={doc.fileUrl}
                     download
                     className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                     title="Scarica"
                   >
                     <Download className="h-4 w-4" />
                   </a>
                   <button
                     onClick={() => handleDelete(doc.id)}
                     className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                     title="Elimina"
                   >
                     <Trash2 className="h-4 w-4" />
                   </button>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {doc.expiryDate && (
                  <div className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1 text-xs font-medium",
                    new Date(doc.expiryDate) < new Date() ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"
                  )}>
                    <span>Scadenza:</span>
                    <span>{format(new Date(doc.expiryDate), "dd/MM/yyyy")}</span>
                  </div>
                )}
                
                {doc.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2" title={doc.notes}>
                    {doc.notes}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Carica Documento</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tipo di Documento *
                </label>
                <select
                  required
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value as "LIBRETTO_CIRCOLAZIONE" | "ASSICURAZIONE" | "ALTRO" })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALTRO">Altro</option>
                  <option value="LIBRETTO_CIRCOLAZIONE">Libretto di circolazione</option>
                  <option value="ASSICURAZIONE">Assicurazione (anno corrente)</option>
                </select>
              </div>

              {formData.documentType === "ASSICURAZIONE" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Anno *
                  </label>
                  <select
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {formData.documentType === "ALTRO" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Titolo Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Es. Certificato, Bollo, etc."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Data Scadenza (Opzionale)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  File (PDF o Immagine) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files ? e.target.files[0] : null })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Note
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Note aggiuntive..."
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  Carica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl h-[85vh] flex flex-col rounded-xl bg-card shadow-2xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedDoc.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedDoc.createdAt), "dd MMMM yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a 
                   href={selectedDoc.fileUrl} 
                   download
                   className="rounded-full p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                   title="Scarica"
                >
                  <Download className="h-5 w-5" />
                </a>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-full p-2 hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-muted/30 overflow-hidden flex items-center justify-center relative">
              {selectedDoc.fileType === "application/pdf" ? (
                <iframe
                  src={selectedDoc.fileUrl}
                  className="w-full h-full border-0"
                  title={selectedDoc.title}
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedDoc.fileUrl} 
                      alt={selectedDoc.title}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                </div>
              )}
            </div>
            
            {selectedDoc.notes && (
              <div className="p-4 border-t border-border bg-card">
                 <p className="text-sm text-muted-foreground">
                   <span className="font-semibold text-foreground">Note:</span> {selectedDoc.notes}
                 </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
