import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmployeeRefuelingPageContent from "@/components/dashboard/employee-refueling-page-content";

export default async function EmployeeRefuelingPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  // Fetch only active vehicles for selection
  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      plate: true,
    },
    orderBy: {
      name: "asc", 
    },
  });

  return <EmployeeRefuelingPageContent vehicles={vehicles} userId={session.user.id} />;
}
