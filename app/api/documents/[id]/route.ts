import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-middleware";
import { successResponse, notFoundResponse, badRequestResponse, handleError } from "@/lib/api-responses";
import { unlink } from "fs/promises";
import path from "path";

const updateDocumentSchema = z.object({
  documentType: z.enum(["LIBRETTO_CIRCOLAZIONE", "ASSICURAZIONE", "ALTRO"]).optional(),
  title: z.string().min(1).optional(),
  year: z.number().int().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const document = await prisma.vehicleDocument.findUnique({ where: { id } });
    if (!document) return notFoundResponse("Documento non trovato");

    const body = await req.json();
    const validation = updateDocumentSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { documentType, title, year, expiryDate, notes } = validation.data;

    const updated = await prisma.vehicleDocument.update({
      where: { id },
      data: {
        ...(documentType !== undefined && { documentType }),
        ...(title !== undefined && { title }),
        ...(year !== undefined && { year }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(notes !== undefined && { notes }),
      },
    });

    return successResponse({
      ...updated,
      expiryDate: updated.expiryDate ? updated.expiryDate.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const document = await prisma.vehicleDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return notFoundResponse("Documento non trovato");
    }

    // Try to delete physical file
    try {
        // Remove leading slash if present to ensure correct path joining
        const relativePath = document.fileUrl.startsWith('/') 
            ? document.fileUrl.substring(1) 
            : document.fileUrl;
            
        const filePath = path.join(process.cwd(), "public", relativePath);
        await unlink(filePath);
    } catch(err) {
        // Ignore file not found errors, but log others
        const error = err as { code?: string };
        if (error.code !== 'ENOENT') {
            console.error("Failed to delete file:", err);
        }
    }

    await prisma.vehicleDocument.delete({
      where: { id },
    });

    return successResponse({ message: "Documento eliminato" });
  } catch (error) {
    return handleError(error);
  }
}
