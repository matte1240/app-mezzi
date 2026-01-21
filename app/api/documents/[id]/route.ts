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
        // Remove leading slash if present to ensure correct path joining
        const relativePath = document.fileUrl.startsWith('/') 
            ? document.fileUrl.substring(1) 
            : document.fileUrl;
            
        const filePath = path.join(process.cwd(), "public", relativePath);
        await unlink(filePath);
    } catch(err: any) {
        // Ignore file not found errors, but log others
        if (err.code !== 'ENOENT') {
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
