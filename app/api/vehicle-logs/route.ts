import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  handleError,
} from "@/lib/api-responses";

const createLogSchema = z.object({
  vehicleId: z.string().min(1, "Seleziona un veicolo"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Data non valida"),
  initialKm: z.number().min(0, "I km iniziali devono essere positivi"),
  finalKm: z.number().min(0, "I km finali devono essere positivi"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora non valido (HH:mm)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora non valido (HH:mm)"),
  route: z.string().min(1, "Inserisci la tratta percorsa"),
  notes: z.string().optional(),
}).refine((data) => data.finalKm >= data.initialKm, {
  message: "I km finali devono essere maggiori o uguali ai km iniziali",
  path: ["finalKm"],
});

export async function GET(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    // If user is not admin, they can only see their own logs
    const targetUserId = session.user.role === "ADMIN" && userId ? userId : session.user.id;

    const logs = await prisma.vehicleLog.findMany({
      where: {
        userId: targetUserId,
      },
      include: {
        vehicle: {
          select: {
            plate: true,
            name: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { finalKm: "desc" },
      ],
      take: 50, // Limit to last 50 logs for now
    });

    return successResponse(logs);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validation = createLogSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { vehicleId, date, initialKm, finalKm, startTime, endTime, route, notes } = validation.data;

    const log = await prisma.vehicleLog.create({
      data: {
        userId: session.user.id,
        vehicleId,
        date: new Date(date),
        initialKm,
        finalKm,
        startTime,
        endTime,
        route,
        notes,
      },
    });

    return successResponse(log, 201);
  } catch (error) {
    return handleError(error);
  }
}
