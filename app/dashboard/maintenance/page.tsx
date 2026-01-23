import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import MaintenanceList from "@/components/dashboard/maintenance-list";

export default async function MaintenancePage() {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    const maintenance = await prisma.maintenanceRecord.findMany({
        include: { vehicle: true },
        orderBy: { date: "desc" },
        take: 100 // Limit for now to avoid overload
    });

    const formattedMaintenance = maintenance.map(m => ({
        ...m,
        cost: m.cost ? m.cost.toNumber() : null,
    }));

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Registro Manutenzioni</h2>
            <MaintenanceList items={formattedMaintenance} />
        </div>
    )
}
