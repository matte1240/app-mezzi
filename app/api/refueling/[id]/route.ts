import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  handleError,
} from "@/lib/api-responses";

const updateRefuelingSchema = z.object({
  date: z.string(),
  liters: z.number().positive(),
  cost: z.number().min(0),
  mileage: z.number().int().positive(),
  notes: z.string().optional(),
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
    const validation = updateRefuelingSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { date, liters, cost, mileage, notes } = validation.data;

    const existingRecord = await prisma.refuelingRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return notFoundResponse("Rifornimento non trovato");
    }

    const updatedRecord = await prisma.refuelingRecord.update({
      where: { id },
      data: {
        date: new Date(date),
        liters,
        cost,
        mileage,
        notes,
      },
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

    const existingRecord = await prisma.refuelingRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return notFoundResponse("Rifornimento non trovato");
    }

    await prisma.refuelingRecord.delete({
      where: { id },
    });

    return successResponse({ message: "Rifornimento eliminato con successo" });
  } catch (error) {
    return handleError(error);
  }
}
