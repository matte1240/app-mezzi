import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-middleware";
import { successResponse, notFoundResponse, handleError } from "@/lib/api-responses";
import { unlink } from "fs/promises";
import path from "path";

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
        const filePath = path.join(process.cwd(), "public", document.fileUrl);
        await unlink(filePath);
    } catch(err) {
        console.error("Failed to delete file:", err);
        // Continue to delete record even if file deletion fails
    }

    await prisma.vehicleDocument.delete({
      where: { id },
    });

    return successResponse({ message: "Documento eliminato" });
  } catch (error) {
    return handleError(error);
  }
}
