import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  handleError,
  conflictResponse,
} from "@/lib/api-responses";

const updateVehicleSchema = z.object({
  plate: z.string().min(1, "La targa è obbligatoria"),
  name: z.string().min(1, "Il nome è obbligatorio"),
  type: z.string().min(1, "Il tipo è obbligatorio"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"]),
  notes: z.string().optional(),
  serviceIntervalKm: z.number().int().positive().default(15000),
  registrationDate: z.string().optional().nullable(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const validation = updateVehicleSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { plate, name, type, status, notes, serviceIntervalKm, registrationDate } = validation.data;

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return notFoundResponse("Veicolo non trovato");
    }

    // Check if plate is taken by another vehicle
    const vehicleWithPlate = await prisma.vehicle.findUnique({
      where: { plate },
    });

    if (vehicleWithPlate && vehicleWithPlate.id !== id) {
      return conflictResponse("Un altro veicolo con questa targa esiste già");
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
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

    return successResponse(updatedVehicle);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return notFoundResponse("Veicolo non trovato");
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    return successResponse({ message: "Veicolo eliminato con successo" });
  } catch (error) {
    return handleError(error);
  }
}
