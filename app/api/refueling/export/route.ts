import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { format } from "date-fns";
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rifornimenti");

    // Setup columns width (without setting headers automatically)
    worksheet.getColumn("A").width = 15; // Date
    worksheet.getColumn("B").width = 25; // Vehicle
    worksheet.getColumn("C").width = 15; // Plate
    worksheet.getColumn("D").width = 10; // Liters
    worksheet.getColumn("E").width = 12; // Cost
    worksheet.getColumn("F").width = 12; // Mileage
    worksheet.getColumn("G").width = 30; // Notes

    // Title Block
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Report Rifornimenti";
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center" };

    // Meta Info
    const periodStr = `Periodo: ${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
    worksheet.mergeCells("A2:G2");
    worksheet.getCell("A2").value = periodStr;

    let vehiclesStr = "Veicoli: Tutti";
    if (vehicleIds && vehicleIds.length > 0) {
      vehiclesStr = `Veicoli: ${vehicleIds.length} selezionati`;
    }
    worksheet.mergeCells("A3:G3");
    worksheet.getCell("A3").value = vehiclesStr;

    // Headers at Row 5
    const headerRow = worksheet.getRow(5);
    headerRow.values = ["Data", "Veicolo", "Targa", "Litri", "Costo (€)", "Km", "Note"];
    headerRow.font = { bold: true };
    // Center align headers
    headerRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center" };
    });

    // Add Data
    records.forEach((record) => {
      worksheet.addRow([
        format(record.date, "dd/MM/yyyy"),
        record.vehicle.name,
        record.vehicle.plate,
        record.liters.toNumber(),
        record.cost.toNumber(),
        record.mileage,
        record.notes || "",
      ]);
    });

    // Enable AutoFilter on headers and data range
    // Must include the data rows so Excel knows what to filter
    const lastDataRowIndex = 5 + records.length;
    worksheet.autoFilter = `A5:G${lastDataRowIndex}`;

    // Add Totals using Formula
    if (records.length > 0) {
      const firstDataRow = 6;
      const lastDataRow = 6 + records.length - 1;

      // Add one empty row for spacing
      worksheet.addRow([]);

      const totalRow = worksheet.addRow([]);
      
      // Label "TOTALE" in Plate column (C)
      const labelCell = totalRow.getCell(3); // C
      labelCell.value = "TOTALE";
      labelCell.font = { bold: true };
      labelCell.alignment = { horizontal: "right" };

      // Liters formula (D)
      const litersCell = totalRow.getCell(4);
      litersCell.value = { formula: `SUBTOTAL(9,D${firstDataRow}:D${lastDataRow})` };
      litersCell.font = { bold: true };

      // Cost formula (E)
      const costCell = totalRow.getCell(5);
      costCell.value = { formula: `SUBTOTAL(9,E${firstDataRow}:E${lastDataRow})` };
      costCell.font = { bold: true };

      // Km formula (F)
      const kmCell = totalRow.getCell(6);
      kmCell.value = { formula: `SUBTOTAL(9,F${firstDataRow}:F${lastDataRow})` };
      kmCell.font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rifornimenti_${format(new Date(), "yyyyMMdd")}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[REFUELING_EXPORT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
