import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  handleError,
} from "@/lib/api-responses";

const updateMaintenanceSchema = z.object({
  date: z.string(),
  type: z.enum(["TAGLIANDO", "GOMME", "MECCANICA", "REVISIONE", "ALTRO"]),
  cost: z.number().min(0).optional(),
  mileage: z.number().int().positive(),
  notes: z.string().optional(),
  tireType: z.enum(["ESTIVE", "INVERNALI", "QUATTRO_STAGIONI"]).optional(),
  tireStorageLocation: z.string().optional(),
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
    const validation = updateMaintenanceSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { date, type, cost, mileage, notes, tireType, tireStorageLocation } = validation.data;

    const existingRecord = await prisma.maintenanceRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return notFoundResponse("Intervento non trovato");
    }

    // Prepara i dati per l'aggiornamento
    const dataToUpdate: Prisma.MaintenanceRecordUpdateInput = {
      date: new Date(date),
      type,
      cost,
      mileage,
      notes: notes || null,
    };

    // Aggiungi campi specifici per le gomme solo se il tipo è GOMME
    if (type === "GOMME") {
      dataToUpdate.tireType = tireType || null;
      dataToUpdate.tireStorageLocation = 
        tireType && tireType !== "QUATTRO_STAGIONI" && tireStorageLocation 
          ? tireStorageLocation 
          : null;
    } else {
      // Se cambia tipo e non è più GOMME, resetta i campi gomme
      dataToUpdate.tireType = null;
      dataToUpdate.tireStorageLocation = null;
    }

    const updatedRecord = await prisma.maintenanceRecord.update({
      where: { id },
      data: dataToUpdate,
    });

    return successResponse(updatedRecord);
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

    const existingRecord = await prisma.maintenanceRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return notFoundResponse("Intervento non trovato");
    }

    await prisma.maintenanceRecord.delete({
      where: { id },
    });

    return successResponse({ message: "Intervento eliminato con successo" });
  } catch (error) {
    return handleError(error);
  }
}
