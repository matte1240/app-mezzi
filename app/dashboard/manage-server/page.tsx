import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ManageServer } from "@/components/dashboard/manage-server";

export const metadata = {
  title: "Manage Server - Employee Tracker",
  description: "Database backup and restore management",
};

export default async function ManageServerPage() {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session?.user) {
    redirect("/");
  }

  // Check admin role
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <ManageServer />;
}
