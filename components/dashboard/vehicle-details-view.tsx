"use client";

import { useState } from "react";
import { 
  Gauge,
  CheckCircle,
  History,
  Car
} from "lucide-react";
import VehicleHistoryTimeline, { TimelineItem } from "./vehicle-history-timeline";
import VehicleMileageCheckModal from "./vehicle-mileage-check-modal";
import VehicleDocuments from "./vehicle-documents";
import type { VehicleStatus } from "@/types/models";
import type { OwnershipType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type VehicleDetailsViewProps = {
  vehicle: {
    id: string;
    plate: string;
    name: string;
    type: string;
    status: VehicleStatus;
    ownershipType?: OwnershipType;
    currentAnomaly?: string | null;
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
  historyItems?: TimelineItem[];
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
  historyItems = [],
  documents,
}: VehicleDetailsViewProps) {
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false);

  const statusColors = {
    ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    MAINTENANCE: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    OUT_OF_SERVICE: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const statusLabels = {
    ACTIVE: "Attivo",
    MAINTENANCE: "In Manutenzione",
    OUT_OF_SERVICE: "Fuori Servizio",
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stato Veicolo</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicle.plate}</div>
              <div className="flex items-center gap-2 mt-1">
                 <Badge variant="outline" className={statusColors[vehicle.status]}>
                    {statusLabels[vehicle.status]}
                 </Badge>
                 {vehicle.ownershipType === 'RENTAL' && (
                     <Badge variant="secondary">Noleggio</Badge>
                 )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{vehicle.name}</p>
            </CardContent>
         </Card>

         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chilometraggio</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lastMileage.toLocaleString()} km</div>
              <p className="text-xs text-muted-foreground mt-1">
                Prossimo tagliando stimato: {((Math.floor(stats.lastMileage / vehicle.serviceIntervalKm) + 1) * vehicle.serviceIntervalKm).toLocaleString()} km
              </p>
            </CardContent>
         </Card>

         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ultimo Utilizzo</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lastUsageDate}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lastUser || "Nessun dato"}
              </p>
            </CardContent>
         </Card>

         <Card className="bg-muted/10 border-dashed">
            <CardContent className="pt-6 flex items-center justify-center h-full">
                <Button onClick={() => setIsMileageModalOpen(true)} className="w-full h-full min-h-[60px]" variant="outline">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Registra Controllo Km
                </Button>
            </CardContent>
         </Card>
      </div>



      {/* Main Content Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none px-0 bg-transparent h-auto p-0 space-x-2">
            <TabsTrigger 
              value="history"
              className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background px-4 py-2"
            >
              Cronologia Unificata
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background px-4 py-2"
            >
              Documenti
            </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
            <VehicleHistoryTimeline items={historyItems} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
             <VehicleDocuments initialDocuments={documents} vehicleId={vehicle.id} />
        </TabsContent>
      </Tabs>

      <VehicleMileageCheckModal 
        isOpen={isMileageModalOpen} 
        onClose={() => setIsMileageModalOpen(false)} 
        vehicleId={vehicle.id} 
      />
    </div>
  );
}
