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

const createMaintenanceSchema = z.object({
  date: z.string(), // ISO string or date string
  type: z.enum(["TAGLIANDO", "GOMME", "MECCANICA", "REVISIONE", "ALTRO"]),
  cost: z.number().min(0).optional(),
  mileage: z.number().int().positive(),
  notes: z.string().optional(),
  tireType: z.enum(["ESTIVE", "INVERNALI", "QUATTRO_STAGIONI"]).optional(),
  tireStorageLocation: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return notFoundResponse("Veicolo non trovato");
    }

    const maintenance = await prisma.maintenanceRecord.findMany({
      where: { vehicleId: id },
      orderBy: { date: "desc" },
    });

    return successResponse(maintenance);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const validation = createMaintenanceSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { date, type, cost, mileage, notes, tireType, tireStorageLocation } = validation.data;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return notFoundResponse("Veicolo non trovato");
    }

    // Prepara i dati per la creazione
    const dataToCreate: Prisma.MaintenanceRecordUncheckedCreateInput = {
      vehicleId: id,
      date: new Date(date),
      type,
      cost,
      mileage,
      notes: notes || null,
    };

    // Aggiungi campi specifici per le gomme solo se il tipo è GOMME
    if (type === "GOMME") {
      dataToCreate.tireType = tireType || null;
      dataToCreate.tireStorageLocation = 
        tireType && tireType !== "QUATTRO_STAGIONI" && tireStorageLocation 
          ? tireStorageLocation 
          : null;
    }

    const maintenance = await prisma.maintenanceRecord.create({
      data: dataToCreate,
    });

    return successResponse(maintenance, 201);
  } catch (error) {
    return handleError(error);
  }
}
