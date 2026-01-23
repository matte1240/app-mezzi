import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const mileageCheckSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  km: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: vehicleId } = await params;
    
    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return new NextResponse("Vehicle not found", { status: 404 });
    }

    const body = await req.json();
    const result = mileageCheckSchema.safeParse(body);
    
    if (!result.success) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    
    const { date, km, notes } = result.data;

    // Validation: Check against the most recent entry
    
    // 1. Get latest Refueling
    const lastRefuel = await prisma.refuelingRecord.findFirst({
        where: { vehicleId },
        orderBy: { date: 'desc' }
    });

    // 2. Get latest Log (use date and check finalKm or initialKm)
    const lastLog = await prisma.vehicleLog.findFirst({
        where: { vehicleId },
        orderBy: { date: 'desc' }
    });

    // 3. Get latest MileageCheck
    const lastCheck = await prisma.mileageCheck.findFirst({
        where: { vehicleId },
        orderBy: { date: 'desc' }
    });

    // Find the max date
    let maxDate = new Date(0);
    // Initialize date with epoch 0
    let lastKnownKm = 0;
    
    // Compare dates
    if (lastRefuel && lastRefuel.date > maxDate) {
        maxDate = lastRefuel.date;
        lastKnownKm = lastRefuel.mileage;
    }

    if (lastLog && lastLog.date > maxDate) {
        maxDate = lastLog.date;
        // Use finalKm if available, else initialKm
        lastKnownKm = lastLog.finalKm ?? lastLog.initialKm;
    }
    
    // Also check if same date but maybe logic differs? 
    // Usually logs are per day. 
    // If multiple entries on same day, simpler to just take max date found so far.
    // If Log date is same as Refuel date, we might not strictly know order, 
    // but usually user enters them sequentially.
    
    if (lastCheck && lastCheck.date > maxDate) {
        maxDate = lastCheck.date;
        lastKnownKm = lastCheck.km;
    } else if (lastCheck && lastCheck.date.getTime() === maxDate.getTime()) {
         // If dates are equal, take the max km seen
         lastKnownKm = Math.max(lastKnownKm, lastCheck.km);
    }
    
    // If the new date is OLDER than maxDate, we shouldn't enforce km > lastKnownKm necessarily, 
    // but the user requirement was: "alla data piu recente, se inserisco un chilometraggio inferiore mostra un alert"
    // which implies "Compared to the *latest known state of the vehicle*, if I insert something lower, warn me".
    // Even if I insert a backdated entry?
    // "alla data piu recente" -> "at the most recent date".
    // So if my new entry is for TODAY, and LAST WEEK we had 1000km, I must put > 1000km.
    // If my new entry is for 2 WEEKS AGO, comparing with TODAY's 1000km is wrong.
    // But the prompt says "si, alla data piu recente, se inserisco un chilometraggio inferiore mostra un alert." - ambiguous.
    // Usually preventing regression of TOTAL km is the goal.
    // If I insert a past entry, I probably want to validate it against the entry *immediately preceding it*.
    // BUT, simpler interpretation: Just check against the global max. 
    // IF the user is backdating, they might trigger this alert mistakenly.
    // However, I will stick to: Check against the entry that is chronologically *previous* to the new entry?
    // OR just check against the absolute latest?
    // "alla data piu recente" -> "regarding the most recent date".
    // I will assume the user typically enters data for "now".
    // I'll check if `date` >= `maxDate`. If so, ensure `km` >= `lastKnownKm`.
    // If `date` < `maxDate`, I'll skip the check or do a smarter check.
    // Given the phrasing, I'll restrict it to: "If date >= maxDate, enforce km >= lastKnownKm".
    
    if (date >= maxDate && km < lastKnownKm) {
        return NextResponse.json(
            { 
                message: `Il chilometraggio inserito (${km}) è inferiore all'ultimo registrato (${lastKnownKm} il ${maxDate.toLocaleDateString()})`,
                code: 'MILEAGE_LOWER_THAN_LAST' 
            },
            { status: 400 }
        );
    }

    const mileageCheck = await prisma.mileageCheck.create({
      data: {
        vehicleId,
        userId: session.user.id,
        date,
        km,
        notes,
      },
    });

    return NextResponse.json(mileageCheck);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("Mileage check creation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
