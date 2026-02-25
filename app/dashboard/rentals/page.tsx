import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ManageVehicles from "@/components/dashboard/manage-vehicles";
import type { Vehicle } from "@/types/models";

export default async function RentalsPage() {
  const session = await getAuthSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const vehiclesData = await prisma.vehicle.findMany({
    where: { ownershipType: "RENTAL" },
    orderBy: { createdAt: "desc" },
    include: {
      logs: { take: 1, orderBy: [{ date: "desc" }, { finalKm: "desc" }], select: { finalKm: true } },
      maintenance: { take: 10, orderBy: { date: "desc" }, select: { mileage: true, type: true } },
      refueling: { take: 1, orderBy: [{ date: "desc" }, { mileage: "desc" }], select: { mileage: true } },
    },
  });

  const vehicles = vehiclesData.map((v) => {
      const lastLogKm = v.logs[0]?.finalKm || 0;
      const lastRefuelingKm = v.refueling[0]?.mileage || 0;
      const lastMaintenanceKm = v.maintenance.reduce((max, m) => Math.max(max, m.mileage), 0);
      const lastTagliando = v.maintenance.find(m => m.type === "TAGLIANDO");
      
      return {
        ...v,
        lastMileage: Math.max(lastLogKm, lastRefuelingKm, lastMaintenanceKm),
        lastServiceKm: lastTagliando?.mileage || 0,
      };
  }) as (Vehicle & { lastMileage: number; lastServiceKm: number })[];

  return <ManageVehicles vehicles={vehicles} />;
}
