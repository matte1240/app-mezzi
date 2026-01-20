import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const vehicleIds = searchParams.get("vehicleIds")?.split(",").filter(Boolean);

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const whereClause: Prisma.RefuelingRecordWhereInput = {
      date: {
        gte: start,
        lte: end,
      },
    };

    if (vehicleIds && vehicleIds.length > 0) {
      whereClause.vehicleId = {
        in: vehicleIds,
      };
    }

    const records = await prisma.refuelingRecord.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            plate: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const serializedRecords = records.map((record) => ({
      ...record,
      liters: record.liters.toNumber(),
      cost: record.cost.toNumber(),
    }));

    return NextResponse.json(serializedRecords);
  } catch (error) {
    console.error("[REFUELING_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
