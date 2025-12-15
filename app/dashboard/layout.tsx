import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import Navbar from "@/components/layout/navbar";
import ActivityTracker from "@/components/features/activity-tracker";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <ActivityTracker />
      <Navbar
        userRole={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />
      <main>{children}</main>
    </div>
  );
}
