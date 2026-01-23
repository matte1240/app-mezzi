import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: vehicleId } = await params;

    const [logs, refuels, maintenance, checks] = await Promise.all([
      prisma.vehicleLog.findMany({
        where: { vehicleId },
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' }
      }),
      prisma.refuelingRecord.findMany({
        where: { vehicleId },
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' }
      }),
      prisma.maintenanceRecord.findMany({
        where: { vehicleId },
        orderBy: { date: 'desc' }
      }),
      prisma.mileageCheck.findMany({
        where: { vehicleId },
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' }
      })
    ]);

    const combined = [
      ...logs.map(l => ({ ...l, type: 'LOG' as const })),
      ...refuels.map(r => ({ ...r, type: 'REFUEL' as const })),
      ...maintenance.map(m => ({ ...m, type: 'MAINTENANCE' as const })),
      ...checks.map(c => ({ ...c, type: 'MILEAGE_CHECK' as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(combined);

  } catch (error) {
    console.error("Vehicle history fetch error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
