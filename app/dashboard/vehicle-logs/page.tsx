import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import VehicleLogForm from "@/components/dashboard/vehicle-log-form";

export const metadata: Metadata = {
  title: "Registro Viaggi | Employee App",
  description: "Gestione utilizzo mezzi aziendali",
};

export default async function VehicleLogsPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:px-12 md:py-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Registro Viaggi</h2>
        <p className="text-muted-foreground">
          Compila il registro giornaliero di utilizzo dei mezzi aziendali.
        </p>
      </div>

      <VehicleLogForm />
    </div>
  );
}
