import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import MaintenanceList from "@/components/dashboard/maintenance-list";

export default async function MaintenancePage() {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    const [vehicles, maintenance] = await Promise.all([
        prisma.vehicle.findMany({
            where: { status: { not: "OUT_OF_SERVICE" } },
            orderBy: { name: "asc" },
            select: { id: true, plate: true, name: true },
        }),
        prisma.maintenanceRecord.findMany({
            include: { vehicle: { select: { id: true, plate: true, name: true } } },
            orderBy: { date: "desc" },
        }),
    ]);

    const serialized = maintenance.map(m => ({
        ...m,
        cost: m.cost ? m.cost.toNumber() : null,
        date: m.date.toISOString(),
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
    }));

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Registro Manutenzioni</h2>
            <MaintenanceList vehicles={vehicles} items={serialized} />
        </div>
    );
}
