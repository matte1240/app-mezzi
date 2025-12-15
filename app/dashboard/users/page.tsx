import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ManageUsers from "@/components/dashboard/manage-users";
import type { User } from "@/types/models";

export default async function UsersPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = (await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      createdAt: true,
    },
  })) as User[];

  return <ManageUsers users={users} currentUserId={session.user.id} />;
}
