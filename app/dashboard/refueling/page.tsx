import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RefuelingPageContent from "@/components/dashboard/refueling-page-content";

export default async function RefuelingPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

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

  return <RefuelingPageContent vehicles={vehicles} />;
}
