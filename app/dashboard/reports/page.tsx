import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminReports from "@/components/dashboard/admin-reports";
import UserReports from "@/components/dashboard/user-reports";
import type { User } from "@/types/models";

export default async function ReportsPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role === "ADMIN") {
    const users = (await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })) as User[];

    return <AdminReports users={users} />;
  } else {
    return (
      <UserReports
        userId={session.user.id}
        userName={session.user.name || session.user.email}
        userEmail={session.user.email}
      />
    );
  }
}
