import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import InsurancesList from "@/components/dashboard/insurances-list";

export default async function InsurancesPage() {
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    const documents = await prisma.vehicleDocument.findMany({
        where: { 
            documentType: "ASSICURAZIONE",
        },
        include: { vehicle: true },
        orderBy: { expiryDate: "asc" }
    });

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Scadenze Assicurazioni</h2>
            <InsurancesList documents={documents} />
        </div>
    )
}
