import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  handleError,
} from "@/lib/api-responses";

const createLogSchema = z.object({
  vehicleId: z.string().min(1, "Seleziona un veicolo"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Data non valida"),
  initialKm: z.number().int("I km devono essere un numero intero").min(0, "I km iniziali devono essere positivi"),
  finalKm: z.number().int("I km devono essere un numero intero").min(0, "I km finali devono essere positivi").optional().nullable(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora non valido (HH:mm)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora non valido (HH:mm)").optional().nullable(),
  route: z.string().min(1, "Inserisci la tratta percorsa").optional().nullable(),
  notes: z.string().optional(),
}).refine((data) => {
    if (data.finalKm !== null && data.finalKm !== undefined) {
        return data.finalKm >= data.initialKm;
    }
    return true;
}, {
  message: "I km finali devono essere maggiori o uguali ai km iniziali",
  path: ["finalKm"],
});

const updateLogSchema = z.object({
    finalKm: z.number().int().positive(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora non valido (HH:mm)"),
    route: z.string().min(1, "Inserisci la tratta percorsa"),
    notes: z.string().optional()
});

export async function GET(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    // If user is not admin, they can only see their own logs
    const targetUserId = session.user.role === "ADMIN" && userId ? userId : session.user.id;

    const logs = await prisma.vehicleLog.findMany({
      where: {
        userId: targetUserId,
      },
      include: {
        vehicle: {
          select: {
            plate: true,
            name: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { finalKm: "desc" },
      ],
      take: 50, // Limit to last 50 logs for now
    });

    return successResponse(logs);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validation = createLogSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(validation.error.issues[0].message);
    }

    const { vehicleId, date, initialKm, finalKm, startTime, endTime, route, notes } = validation.data;

    // Ensure we handle undefined values for optional fields by defaulting to null
    // or relying on Prisma's optional/nullable handling.
    // However, validation.data.finalKm might be undefined.
    // If the schema expects Int?, passing undefined is valid for "do not set", 
    // but explicit null is safer if we want to ensure it's NULL in DB.
    
    const log = await prisma.vehicleLog.create({
      data: {
        userId: session.user.id,
        vehicleId,
        date: new Date(date),
        initialKm,
        finalKm: finalKm ?? null,
        startTime,
        endTime: endTime ?? null,
        route: route ?? null,
        notes: notes ?? null,
      },
    });

    return successResponse(log, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return badRequestResponse("ID del log non specificato");
    }

    // Verifica che il log esista e appartenga all'utente (o che l'utente sia admin)
    const log = await prisma.vehicleLog.findUnique({
      where: { id },
    });

    if (!log) {
      return badRequestResponse("Log non trovato");
    }

    // Solo admin o il proprietario del log possono eliminarlo
    if (session.user.role !== "ADMIN" && log.userId !== session.user.id) {
      return badRequestResponse("Non hai i permessi per eliminare questo log");
    }

    await prisma.vehicleLog.delete({
      where: { id },
    });

    return successResponse({ message: "Log eliminato con successo" });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
    try {
        const { session, error } = await requireAuth();
        if (error) return error;

        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return badRequestResponse("ID del log mancante");
        }

        const valid = updateLogSchema.safeParse(data);
        if (!valid.success) {
             return badRequestResponse(valid.error.issues[0].message);
        }

        const log = await prisma.vehicleLog.findUnique({ where: { id }});
        if (!log) return badRequestResponse("Log non trovato");
        
        if (session.user.role !== "ADMIN" && log.userId !== session.user.id) {
             return badRequestResponse("Non autorizzato");
        }

        if (valid.data.finalKm < log.initialKm) {
             return badRequestResponse("Km finali minori di km iniziali");
        }

        const updated = await prisma.vehicleLog.update({
            where: { id },
            data: {
                finalKm: valid.data.finalKm,
                endTime: valid.data.endTime,
                route: valid.data.route,
                notes: valid.data.notes || log.notes
            }
        });

        return successResponse(updated);

    } catch(error) {
        return handleError(error);
    }
}
