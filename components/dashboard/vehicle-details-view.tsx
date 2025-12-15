"use client";

import { useState } from "react";
import { 
  Truck, 
  Wrench, 
  History, 
  LayoutDashboard, 
  Calendar,
  MapPin,
  User,
  Clock,
  Gauge,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addYears, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import VehicleLogList from "./vehicle-log-list";
import VehicleMaintenance from "./vehicle-maintenance";
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
  logs: any[];
  maintenance: any[];
};

export default function VehicleDetailsView({ 
  vehicle, 
  stats, 
  logs, 
  maintenance 
}: VehicleDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "maintenance">("overview");

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
                <h1 className="text-2xl font-bold text-foreground">{vehicle.plate}</h1>
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
            <p className="text-2xl font-bold text-foreground mt-1">{nextServiceKm.toLocaleString('it-IT')} km</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ultimo Utilizzo</p>
            <p className="text-lg font-semibold text-foreground mt-1 truncate" title={stats.lastUsageDate}>
              {stats.lastUsageDate}
            </p>
            {stats.lastUser && (
              <p className="text-xs text-muted-foreground truncate">{stats.lastUser}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Totale Viaggi</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.totalLogs}</p>
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
                    <History className="h-5 w-5 text-muted-foreground" />
                    Ultimi Viaggi
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(log.date), "dd MMMM yyyy", { locale: it })}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <User className="h-3 w-3" />
                            {log.user.name || log.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {log.finalKm - log.initialKm} km
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.startTime} - {log.endTime}
                        </p>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      Nessun viaggio recente
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
      </div>
    </div>
  );
}
