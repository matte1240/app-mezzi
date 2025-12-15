"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Clock, Gauge, Truck, User } from "lucide-react";
import { MonthPicker } from "@/components/ui/month-picker";

type VehicleLog = {
  id: string;
  date: string;
  initialKm: number;
  finalKm: number;
  startTime: string;
  endTime: string;
  route: string;
  vehicle: {
    plate: string;
    name: string;
  };
  user: {
    name: string | null;
    email: string;
  };
};

type VehicleLogListProps = {
  logs: VehicleLog[];
};

export default function VehicleLogList({ logs }: VehicleLogListProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (logs.length > 0) {
      return format(new Date(logs[0].date), "yyyy-MM");
    }
    return format(new Date(), "yyyy-MM");
  });

  // Filter logs for the selected month
  const currentLogs = logs.filter((log) => {
    const logMonth = format(new Date(log.date), "yyyy-MM");
    return logMonth === selectedMonth;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">Storico Utilizzi</h3>
        
        <div className="w-full sm:w-[240px]">
          <MonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Veicolo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orario</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Km</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tratta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nessun registro trovato per questo mese.
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-muted/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                      {format(new Date(log.date), "dd/MM/yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{log.user.name || log.user.email}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{log.vehicle.plate}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.vehicle.name}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-3 w-3" />
                        {log.startTime} - {log.endTime}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Gauge className="mr-2 h-3 w-3" />
                        {log.finalKm - log.initialKm} km
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({log.initialKm} - {log.finalKm})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{log.route}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
