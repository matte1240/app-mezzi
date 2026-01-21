import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-middleware";
import { successResponse, badRequestResponse, handleError, notFoundResponse } from "@/lib/api-responses";
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
    const titleInput = formData.get("title") as string;
    const documentType = formData.get("documentType") as string;
    const yearStr = formData.get("year") as string | null;
    const notes = formData.get("notes") as string | null;
    const expiryDateStr = formData.get("expiryDate") as string | null;

    if (!file) {
      return badRequestResponse("Nessun file caricato");
    }

    if (!allowedTypes.includes(file.type)) {
      return badRequestResponse("Tipo di file non supportato. Usa PDF o immagini.");
    }

    if (!documentType || !["LIBRETTO_CIRCOLAZIONE", "ASSICURAZIONE", "ALTRO"].includes(documentType)) {
      return badRequestResponse("Tipo di documento non valido");
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { plate: true, name: true }
    });

    if (!vehicle) {
      return notFoundResponse("Veicolo non trovato");
    }

    // Genera automaticamente il titolo in base al tipo
    let title: string;
    let year: number | null = null;
    
    if (documentType === "LIBRETTO_CIRCOLAZIONE") {
      title = "Libretto di circolazione";
    } else if (documentType === "ASSICURAZIONE") {
      if (!yearStr) {
        return badRequestResponse("L'anno è obbligatorio per l'assicurazione");
      }
      year = parseInt(yearStr, 10);
      if (isNaN(year) || year < 1900 || year > 2100) {
        return badRequestResponse("Anno non valido");
      }
      title = `Assicurazione ${year}`;
    } else {
      // ALTRO - il titolo è obbligatorio
      if (!titleInput) {
        return badRequestResponse("Il titolo è obbligatorio");
      }
      title = titleInput;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a standardized filename: PLATE_TYPE_YEAR_TIMESTAMP.ext
    const sanitizedPlate = vehicle.plate.replace(/\s+/g, '').toUpperCase();
    const sanitizedType = documentType;
    const yearSuffix = year ? `_${year}` : '';
    const timestamp = Date.now();
    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg'); // fallback extension
    
    const fileName = `${sanitizedPlate}_${sanitizedType}${yearSuffix}_${timestamp}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
    
    const fileUrl = `/uploads/documents/${fileName}`;

    const document = await prisma.vehicleDocument.create({
      data: {
        vehicleId: id,
        documentType: documentType as "LIBRETTO_CIRCOLAZIONE" | "ASSICURAZIONE" | "ALTRO",
        title,
        year,
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
