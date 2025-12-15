import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  conflictResponse,
  handleError,
} from "@/lib/api-responses";

const createVehicleSchema = z.object({
  plate: z.string().min(1, "La targa è obbligatoria"),
  name: z.string().min(1, "Il nome è obbligatorio"),
  type: z.string().min(1, "Il tipo è obbligatorio"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"]).default("ACTIVE"),
  notes: z.string().optional(),
  serviceIntervalKm: z.number().int().positive().default(15000),
  registrationDate: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
    });

    return successResponse(vehicles);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const validation = createVehicleSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { plate, name, type, status, notes, serviceIntervalKm, registrationDate } = validation.data;

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate },
    });

    if (existingVehicle) {
      return conflictResponse("Un veicolo con questa targa esiste già");
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plate,
        name,
        type,
        status,
        notes,
        serviceIntervalKm,
        registrationDate: registrationDate ? new Date(registrationDate) : null,
      },
    });

    return successResponse(vehicle, 201);
  } catch (error) {
    return handleError(error);
  }
}
