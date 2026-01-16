import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  redirect("/dashboard/vehicles");
}
