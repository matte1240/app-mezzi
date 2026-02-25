import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import InsurancesList from "@/components/dashboard/insurances-list";

export default async function InsurancesPage() {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    const [vehicles, documents] = await Promise.all([
        prisma.vehicle.findMany({
            where: { status: { not: "OUT_OF_SERVICE" } },
            orderBy: { name: "asc" },
            select: { id: true, plate: true, name: true },
        }),
        prisma.vehicleDocument.findMany({
            where: { documentType: "ASSICURAZIONE" },
            include: { vehicle: { select: { id: true, plate: true, name: true } } },
            orderBy: { expiryDate: "asc" },
        }),
    ]);

    const serializedDocuments = documents.map((d) => ({
        id: d.id,
        vehicleId: d.vehicleId,
        vehicle: d.vehicle,
        year: d.year,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
        notes: d.notes,
        createdAt: d.createdAt.toISOString(),
    }));

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Scadenze Assicurazioni</h2>
            <InsurancesList vehicles={vehicles} documents={serializedDocuments} />
        </div>
    );
}

