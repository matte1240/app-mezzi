"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  QrCode,
  Clock,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ActiveVehicle = {
  id: string;
  plate: string;
  name: string;
  type: string;
  lastMileage: number;
  currentTrip: {
    id: string;
    userId: string;
    userName: string;
    startTime: string;
    initialKm: number;
  } | null;
};

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleIdParam = searchParams.get("vehicleId");

  const [isPending, startTransition] = useTransition();
  const [, setVehicles] = useState<ActiveVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<ActiveVehicle | null>(null);

  // Form states depending on mode
  const [initialKm, setInitialKm] = useState<number | string>("");
  const [finalKm, setFinalKm] = useState<number | string>("");
  const [hasAnomaly, setHasAnomaly] = useState(false);
  const [anomalyDescription, setAnomalyDescription] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles/active");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);
          
          if (vehicleIdParam) {
            const vehicle = data.find((v: ActiveVehicle) => v.id === vehicleIdParam);
            if (vehicle) {
              setSelectedVehicle(vehicle);
              // If there's no open trip, prepopulate initialKm
              if (!vehicle.currentTrip) {
                  setInitialKm(vehicle.lastMileage);
              }
              // Check if trip belongs to someone else 
              // (Note: For security, API should flag if it's current user's trip, 
              // but here we might need to rely on what API returns or check user session if available.
              // For now, let's assume we can't edit other's trips if API prevents it.
              // But strictly speaking, the active/route.ts returns userId.
              // We'd need to know *my* userId. 
              // Let's assume the API handles the permission check on submission,
              // but UI needs to show "Busy" status.)
              
              // To properly disable, we need current user ID. 
              // We can fetch it or just handle the error on submit.
              // Better UX: fetch session or have API return `isMyTrip` boolean.
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
        setError("Impossibile caricare i veicoli");
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [vehicleIdParam]);

  const handleStartTrip = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedVehicle) return;
      setError(null);
      
      const km = Number(initialKm);
      if (isNaN(km) || km < 0) {
          setError("Inserisci un kilometraggio valido");
          return;
      }

      startTransition(async () => {
        try {
            const now = new Date();
            const dateStr = format(now, "yyyy-MM-dd");
            const startTimeStr = format(now, "HH:mm");

            const res = await fetch("/api/vehicle-logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vehicleId: selectedVehicle.id,
                    date: dateStr,
                    initialKm: km,
                    startTime: startTimeStr,
                    // finalKm, endTime, route are omitted to create Open Trip
                }),
            });

            const data = await res.json();
            if(!res.ok) {
                setError(data.error || "Errore apertura viaggio");
                return;
            }

            setSuccess("Viaggio aperto!");
            refreshData();
        } catch {
            setError("Errore di connessione");
        }
      });
  };

  const handleEndTrip = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedVehicle || !selectedVehicle.currentTrip) return;
      setError(null);

      const km = Number(finalKm);
      if (isNaN(km) || km <= selectedVehicle.currentTrip.initialKm) {
          setError(`I Km finali devono essere maggiori di ${selectedVehicle.currentTrip.initialKm}`);
          return;
      }

      startTransition(async () => {
         try {
             const now = new Date();
             const endTimeStr = format(now, "HH:mm");
             
             const res = await fetch("/api/vehicle-logs", {
                 method: "PUT",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({
                     id: selectedVehicle.currentTrip!.id,
                     finalKm: km,
                     endTime: endTimeStr,
                     route: "Viaggio completato (Scan)",
                     hasAnomaly,
                     anomalyDescription: hasAnomaly ? anomalyDescription : null,
                     // notes optional
                 })
             });
             
             const data = await res.json();
             if (!res.ok) {
                 setError(data.error || "Errore chiusura viaggio");
                 return;
             }
             
             setSuccess("Viaggio chiuso con successo!");
             setFinalKm("");
             setHasAnomaly(false);
             setAnomalyDescription("");
             refreshData();

         } catch {
             setError("Errore di connessione");
         }
      });
  };

  const refreshData = async () => {
    const vRes = await fetch("/api/vehicles/active");
    if (vRes.ok) {
        const vData = await vRes.json();
        setVehicles(vData);
        const updated = vData.find((v: ActiveVehicle) => v.id === selectedVehicle?.id);
        if (updated) setSelectedVehicle(updated);
    }
    router.refresh();
  };


  if (loadingVehicles) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedVehicle) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Veicolo non trovato</CardTitle>
          <CardDescription>
            Il codice QR scansionato non corrisponde a nessun veicolo attivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/dashboard/vehicles')}>Vai alla lista veicoli</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-xl">{selectedVehicle.name}</CardTitle>
                    <CardDescription className="font-mono font-medium text-foreground/80">{selectedVehicle.plate}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center space-y-4 dark:bg-emerald-900/20 dark:border-emerald-800">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center dark:bg-emerald-800">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-emerald-800 dark:text-emerald-300">{selectedVehicle.currentTrip ? "Viaggio Aperto" : "Viaggio Completato"}</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {selectedVehicle.currentTrip ? "Buon viaggio!" : "Viaggio chiuso con successo."}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-emerald-200 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:hover:bg-emerald-900"
                onClick={() => setSuccess(null)}
              >
                Torna al veicolo
              </Button>
            </div>
          ) : (
             <>
             {/* CASE 1: Open Trip Exists (Close Trip UI) */}
             {selectedVehicle.currentTrip ? (
                 <form onSubmit={handleEndTrip} className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2 border border-blue-100 dark:border-blue-800">
                         <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                             <Clock className="h-4 w-4" />
                             <span className="font-semibold text-sm">Viaggio in corso</span>
                         </div>
                         <div className="text-xs text-blue-600 dark:text-blue-400">
                            Iniziato alle {selectedVehicle.currentTrip.startTime} da {selectedVehicle.currentTrip.userName}
                         </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Inizio</span>
                            <span className="text-lg font-bold font-mono">{selectedVehicle.currentTrip.initialKm.toLocaleString()} km</span>
                        </div>
                        
                        <div className="flex justify-center text-muted-foreground"><ArrowRight className="h-5 w-5 rotate-90" /></div>

                        <div className="space-y-2">
                             <label className="text-sm font-medium">Km Arrivo</label>
                             <Input 
                                type="number" 
                                value={finalKm} 
                                onChange={(e) => setFinalKm(e.target.value)} 
                                placeholder="Inserisci km finali"
                                required
                                min={selectedVehicle.currentTrip.initialKm}
                                className="text-lg h-12 font-mono"
                                autoFocus
                             />
                        </div>
                    </div>

                    <div className="bg-background rounded-lg border p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                           <input
                              type="checkbox"
                              id="scanHasAnomaly"
                              className="h-5 w-5 rounded border-gray-300 text-destructive focus:ring-destructive"
                              checked={hasAnomaly}
                              onChange={(e) => setHasAnomaly(e.target.checked)}
                           />
                           <label htmlFor="scanHasAnomaly" className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                             Segnala Anomalia / Guasto
                           </label>
                        </div>
                        
                        {hasAnomaly && (
                           <div className="animate-in fade-in slide-in-from-top-2">
                               <textarea
                                   className="flex min-h-[80px] w-full rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm ring-offset-background placeholder:text-destructive/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                   placeholder="Descrivi il problema..."
                                   value={anomalyDescription}
                                   onChange={(e) => setAnomalyDescription(e.target.value)}
                                   required
                               />
                           </div>
                        )}
                    </div>

                     {error && <div className="text-destructive text-sm font-medium">{error}</div>}

                     <Button type="submit" className="w-full h-12" disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : "Chiudi Corsa"}
                     </Button>
                 </form>
             ) : (
             /* CASE 2: No Open Trip (Start Trip UI) */
                 <form onSubmit={handleStartTrip} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Km Partenza</label>
                        <Input 
                            type="number"
                            value={initialKm}
                            onChange={(e) => setInitialKm(e.target.value)}
                            placeholder="Km attuali"
                            required
                            className="text-lg h-12 font-mono"
                        />
                        <p className="text-xs text-muted-foreground">Verifica che i km corrispondano al cruscotto.</p>
                    </div>

                    {error && <div className="text-destructive text-sm font-medium">{error}</div>}

                    <Button type="submit" className="w-full h-12" disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : "Apri Corsa"}
                    </Button>
                 </form>
             )}
             </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ScanContent />
    </Suspense>
  );
}
