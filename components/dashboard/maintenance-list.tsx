"use client";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Wrench } from "lucide-react";

type MaintenanceItem = {
    id: string;
    date: Date | string;
    type: string;
    cost: number | null;
    mileage: number;
    notes?: string | null;
    vehicle: {
        plate: string;
        name: string;
    };
};

export default function MaintenanceList({ items }: { items: MaintenanceItem[] }) {
    if (items.length === 0) return <div className="text-center p-8 text-muted-foreground">Nessuna manutenzione registrata.</div>;

    return (
        <div className="grid gap-4">
            {items.map(item => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-1 mb-2 md:mb-0">
                        <div className="font-semibold flex items-center gap-2 text-lg">
                            <span>{item.vehicle.plate}</span>
                            <span className="text-muted-foreground font-normal text-sm hidden sm:inline-block">({item.vehicle.name})</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                             <Wrench className="h-4 w-4" />
                             <span className="font-medium">{item.type}</span>
                             <span className="mx-1">•</span>
                             {format(new Date(item.date), "d MMMM yyyy", { locale: it })}
                        </div>
                        {item.notes && <div className="text-xs text-muted-foreground italic mt-1 max-w-md">&quot;{item.notes}&quot;</div>}
                    </div>
                    <div className="text-left md:text-right flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-0 pt-2 md:pt-0">
                         <div className="font-bold text-lg text-primary">€ {item.cost ? Number(item.cost).toFixed(2) : "0.00"}</div>
                         <div className="text-sm text-muted-foreground">{item.mileage} km</div>
                    </div>
                </div>
            ))}
        </div>
    )
}
