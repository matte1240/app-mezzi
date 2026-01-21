import { requireAuth } from "@/lib/api-middleware";
import prisma from "@/lib/prisma";
import { successResponse, handleError } from "@/lib/api-responses";

export async function GET() {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        plate: true,
        name: true,
        type: true,
        logs: {
          take: 1,
          orderBy: [
            { date: "desc" },
            { finalKm: "desc" },
          ],
          select: {
            id: true,
            initialKm: true,
            finalKm: true,
            startTime: true,
            userId: true,
            user: {
                select: {
                    name: true
                }
            }
          },
        },
      },
      orderBy: {
        plate: "asc",
      },
    });

    const formattedVehicles = vehicles.map((v) => {
        const lastLog = v.logs[0];
        // If finalKm is null, it's an OPEN trip
        // OR if there's a log, finalKm *might* be null.
        // Wait, the orderBy finalKm desc will put nulls last usually.
        // We should explicitly look for open logs.
        // But for "lastMileage", we need the last *closed* log really, OR the current open log's initialKm?
        // Actually, let's just inspect the latest log.
        
        const isOpen = lastLog && lastLog.finalKm === null;
        
        return {
            id: v.id,
            plate: v.plate,
            name: v.name,
            type: v.type,
            lastMileage: lastLog ? (lastLog.finalKm ?? lastLog.initialKm) : 0,
            currentTrip: isOpen ? {
                id: lastLog.id,
                userId: lastLog.userId,
                userName: lastLog.user.name,
                startTime: lastLog.startTime,
                initialKm: lastLog.initialKm
            } : null
        };
    });

    return successResponse(formattedVehicles);
  } catch (error) {
    return handleError(error);
  }
}
