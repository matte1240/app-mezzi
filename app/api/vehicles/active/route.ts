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
            finalKm: true,
          },
        },
      },
      orderBy: {
        plate: "asc",
      },
    });

    const formattedVehicles = vehicles.map((v) => ({
      id: v.id,
      plate: v.plate,
      name: v.name,
      type: v.type,
      lastMileage: v.logs[0]?.finalKm || 0,
    }));

    return successResponse(formattedVehicles);
  } catch (error) {
    return handleError(error);
  }
}
