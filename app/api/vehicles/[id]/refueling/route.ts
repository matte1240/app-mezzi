import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  handleError,
} from "@/lib/api-responses";

const createRefuelingSchema = z.object({
  date: z.string(),
  liters: z.number().positive(),
  cost: z.number().min(0),
  mileage: z.number().int().positive(),
  notes: z.string().optional(),
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

    const refueling = await prisma.refuelingRecord.findMany({
      where: { vehicleId: id },
      orderBy: { date: "desc" },
    });

    return successResponse(refueling);
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
    const validation = createRefuelingSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { date, liters, cost, mileage, notes } = validation.data;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return notFoundResponse("Veicolo non trovato");
    }

    const refueling = await prisma.refuelingRecord.create({
      data: {
        vehicleId: id,
        date: new Date(date),
        liters,
        cost,
        mileage,
        notes,
      },
    });

    return successResponse(refueling, 201);
  } catch (error) {
    return handleError(error);
  }
}
