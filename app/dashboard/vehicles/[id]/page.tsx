import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VehicleDetailsView from "@/components/dashboard/vehicle-details-view";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VehicleDetailPage({ params }: Props) {
  const session = await getAuthSession();
  const { id } = await params;

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const vehicle = (await prisma.vehicle.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: [
          { date: "desc" },
          { finalKm: "desc" },
        ],
        include: {
          vehicle: true, // Needed for VehicleLogList
          user: true,
        },
      },
      maintenance: {
        orderBy: { date: "desc" },
      },
      refueling: {
        orderBy: { date: "desc" },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  }));

  if (!vehicle) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Veicolo non trovato</h2>
        <Link href="/dashboard/vehicles" className="text-primary hover:underline mt-4 inline-block">
          Torna alla lista
        </Link>
      </div>
    );
  }

  const formattedLogs = vehicle.logs.map((log) => ({
    id: log.id,
    date: log.date.toISOString(),
    initialKm: log.initialKm,
    finalKm: log.finalKm,
    startTime: log.startTime,
    endTime: log.endTime,
    route: log.route,
    vehicle: {
      plate: log.vehicle.plate,
      name: log.vehicle.name,
    },
    user: {
      name: log.user.name,
      email: log.user.email,
    },
  }));

  const formattedMaintenance = vehicle.maintenance.map((record) => ({
    id: record.id,
    date: record.date.toISOString(),
    type: record.type,
    cost: record.cost ? record.cost.toNumber() : null,
    mileage: record.mileage,
    notes: record.notes,
    tireType: record.tireType,
    tireStorageLocation: record.tireStorageLocation,
  }));

  const formattedRefueling = vehicle.refueling.map((record) => ({
    id: record.id,
    date: record.date.toISOString(),
    liters: record.liters ? record.liters.toNumber() : 0,
    cost: record.cost ? record.cost.toNumber() : 0,
    mileage: record.mileage,
    notes: record.notes,
  }));

  const formattedDocuments = vehicle.documents.map((doc) => ({
    id: doc.id,
    documentType: doc.documentType,
    title: doc.title,
    year: doc.year,
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : null,
    notes: doc.notes,
    createdAt: doc.createdAt.toISOString(),
  }));

  const lastLog = vehicle.logs[0];
  const lastRefueling = vehicle.refueling[0];

  const lastLogKm = lastLog ? lastLog.finalKm : 0;
  const lastRefuelingKm = lastRefueling ? lastRefueling.mileage : 0;
  const lastMaintenanceKm = vehicle.maintenance.reduce((max, r) => Math.max(max, r.mileage), 0);
  const lastMileage = Math.max(lastLogKm, lastRefuelingKm, lastMaintenanceKm);

  const totalLogs = vehicle.logs.length;
  const lastUsageDate = lastLog ? new Date(lastLog.date).toLocaleDateString("it-IT") : "Mai";
  const lastUser = lastLog ? (lastLog.user.name || lastLog.user.email) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/vehicles"
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h2 className="text-lg font-semibold text-muted-foreground">Torna alla lista</h2>
      </div>

      <VehicleDetailsView
        vehicle={{
          id: vehicle.id,
          plate: vehicle.plate,
          name: vehicle.name,
          type: vehicle.type,
          status: vehicle.status,
          notes: vehicle.notes,
          serviceIntervalKm: vehicle.serviceIntervalKm || 15000,
          registrationDate: vehicle.registrationDate,
        }}
        stats={{
          lastMileage,
          totalLogs,
          lastUsageDate,
          lastUser,
        }}
        logs={formattedLogs}
        maintenance={formattedMaintenance}
        refueling={formattedRefueling}
        documents={formattedDocuments}
      />
    </div>
  );
}
