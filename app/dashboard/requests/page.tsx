import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import RequestsList from "@/components/dashboard/requests-list";

export default async function RequestsPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <RequestsList isAdmin={isAdmin} />
    </div>
  );
}
