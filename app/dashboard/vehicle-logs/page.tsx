import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import VehicleLogForm from "@/components/dashboard/vehicle-log-form";

export const metadata: Metadata = {
  title: "Registro Mezzi | Employee App",
  description: "Gestione utilizzo mezzi aziendali",
};

export default async function VehicleLogsPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Registro Mezzi</h2>
          <p className="text-muted-foreground">
            Compila il registro giornaliero di utilizzo dei mezzi aziendali.
          </p>
        </div>

        <VehicleLogForm />
      </div>
    </div>
  );
}
