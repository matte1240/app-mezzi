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
        include: { user: true },
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
      mileageChecks: {
        orderBy: { date: "desc" },
        include: { user: true },
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

  const historyItems = [
    ...vehicle.logs.map(log => ({
        id: log.id,
        date: log.date.toISOString(),
        type: 'LOG' as const,
        data: {
             initialKm: log.initialKm,
             finalKm: log.finalKm,
             route: log.route,
             notes: log.notes,
             user: { name: log.user.name || log.user.email }
        }
    })),
    ...vehicle.maintenance.map(item => ({
        id: item.id,
        date: item.date.toISOString(),
        type: 'MAINTENANCE' as const,
        data: {
            type: item.type,
            cost: item.cost ? item.cost.toNumber() : null,
            mileage: item.mileage,
            notes: item.notes
        }
    })),
    ...vehicle.refueling.map(item => ({
        id: item.id,
        date: item.date.toISOString(),
        type: 'REFUEL' as const,
        data: {
            liters: item.liters ? item.liters.toNumber() : 0,
            cost: item.cost ? item.cost.toNumber() : 0,
            mileage: item.mileage,
            notes: item.notes,
            user: { name: item.user?.name || item.user?.email || "N/D" }
        }
    })),
    ...vehicle.mileageChecks.map(item => ({
        id: item.id,
        date: item.date.toISOString(),
        type: 'MILEAGE_CHECK' as const,
        data: {
            km: item.km,
            notes: item.notes,
            user: { name: item.user.name || item.user.email }
        }
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastLog = vehicle.logs[0];
  const lastRefueling = vehicle.refueling[0];
  const lastCheck = vehicle.mileageChecks[0];

  const lastLogKm = lastLog?.finalKm ?? lastLog?.initialKm ?? 0;
  const lastRefuelingKm = lastRefueling ? lastRefueling.mileage : 0;
  const lastMaintenanceKm = vehicle.maintenance.reduce((max, r) => Math.max(max, r.mileage), 0);
  const lastCheckKm = lastCheck ? lastCheck.km : 0;
  
  const lastMileage = Math.max(lastLogKm, lastRefuelingKm, lastMaintenanceKm, lastCheckKm);

  const totalLogs = vehicle.logs.length;
  const lastUsageDate = lastLog ? new Date(lastLog.date).toLocaleDateString("it-IT") : "Mai";
  const lastUser = lastLog ? (lastLog.user.name || lastLog.user.email) : null;

  return (
    <div className="flex-1 space-y-4 p-4 md:px-12 md:py-8 pt-6">
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
          ownershipType: vehicle.ownershipType,
          currentAnomaly: vehicle.currentAnomaly,
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
        documents={formattedDocuments}
        historyItems={historyItems}
      />
    </div>
  );
}
