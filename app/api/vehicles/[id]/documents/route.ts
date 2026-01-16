import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-middleware";
import { successResponse, badRequestResponse, handleError } from "@/lib/api-responses";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const notes = formData.get("notes") as string | null;
    const expiryDateStr = formData.get("expiryDate") as string | null;

    if (!file) {
      return badRequestResponse("Nessun file caricato");
    }

    if (!allowedTypes.includes(file.type)) {
      return badRequestResponse("Tipo di file non supportato. Usa PDF o immagini.");
    }

    if (!title) {
      return badRequestResponse("Il titolo è obbligatorio");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
    
    const fileUrl = `/uploads/documents/${fileName}`;

    const document = await prisma.vehicleDocument.create({
      data: {
        vehicleId: id,
        title,
        fileUrl,
        fileType: file.type,
        notes,
        expiryDate: expiryDateStr && expiryDateStr !== "undefined" ? new Date(expiryDateStr) : null,
      },
    });

    return successResponse(document, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;
    
        const { id } = await params;

        const documents = await prisma.vehicleDocument.findMany({
            where: { vehicleId: id },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse(documents);

    } catch(error) {
        return handleError(error);
    }
}
