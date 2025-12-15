import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ManageVehicles from "@/components/dashboard/manage-vehicles";
import type { Vehicle } from "@/types/models";

export default async function VehiclesPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const vehiclesData = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      logs: {
        take: 1,
        orderBy: [
          { date: "desc" },
          { finalKm: "desc" },
        ],
        select: {
          finalKm: true,
        },
      },
      maintenance: {
        where: { type: "TAGLIANDO" },
        take: 1,
        orderBy: { date: "desc" },
        select: {
          mileage: true,
        },
      },
    },
  });

  const vehicles = vehiclesData.map((v) => ({
    ...v,
    lastMileage: v.logs[0]?.finalKm || 0,
    lastServiceKm: v.maintenance[0]?.mileage || 0,
  })) as (Vehicle & { lastMileage: number; lastServiceKm: number })[];

  return <ManageVehicles vehicles={vehicles} />;
}
