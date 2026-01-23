import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
    Truck, 
    Fuel, 
    Wrench, 
    FileCheck, 
    User,
    History as HistoryIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type TimelineItem = {
    id: string;
    date: Date | string;
    type: 'LOG' | 'REFUEL' | 'MAINTENANCE' | 'MILEAGE_CHECK';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
};

export default function VehicleHistoryTimeline({ items }: { items: TimelineItem[] }) {
    const [filter, setFilter] = useState<'ALL' | 'LOG' | 'REFUEL' | 'MAINTENANCE' | 'MILEAGE_CHECK'>('ALL');

    const filteredItems = items
        .filter(item => filter === 'ALL' || item.type === filter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getColor = (type: string) => {
        switch (type) {
            case 'LOG': return "bg-blue-500 text-blue-500 dark:bg-blue-400 dark:text-blue-400";
            case 'REFUEL': return "bg-green-500 text-green-500 dark:bg-green-400 dark:text-green-400";
            case 'MAINTENANCE': return "bg-orange-500 text-orange-500 dark:bg-orange-400 dark:text-orange-400";
            case 'MILEAGE_CHECK': return "bg-purple-500 text-purple-500 dark:bg-purple-400 dark:text-purple-400";
            default: return "bg-gray-500 text-gray-500";
        }
    };
    
    // Badge colors
     const getBadgeStyle = (type: string) => {
        switch (type) {
            case 'LOG': return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";
            case 'REFUEL': return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300";
            case 'MAINTENANCE': return "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300";
            case 'MILEAGE_CHECK': return "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5" />
                    Cronologia Attività
                </h3>
                <div className="relative">
                    <select 
                        value={filter} 
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onChange={(e: any) => setFilter(e.target.value)}
                        className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    >
                        <option value="ALL">Tutte le attività</option>
                        <option value="LOG">Viaggi</option>
                        <option value="REFUEL">Rifornimenti</option>
                        <option value="MAINTENANCE">Manutenzione</option>
                        <option value="MILEAGE_CHECK">Controlli Km</option>
                    </select>
                </div>
            </div>

            <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-8 mt-2">
                {filteredItems.length === 0 && (
                    <div className="pl-8 text-muted-foreground italic py-4">Nessuna attività registrata.</div>
                )}
                {filteredItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="relative pl-8">
                        {/* Dot on timeline */}
                        <div className={`absolute -left-[9px] top-4 h-4 w-4 rounded-full border-4 border-background ${getColor(item.type)}`} />
                        
                        <Card className="mb-4">
                            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-muted/20 border-b">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className={getBadgeStyle(item.type)}>
                                        {item.type === 'LOG' && 'VIAGGIO'}
                                        {item.type === 'REFUEL' && 'RIFORNIMENTO'}
                                        {item.type === 'MAINTENANCE' && 'MANUTENZIONE'}
                                        {item.type === 'MILEAGE_CHECK' && 'CONTROLLO KM'}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground font-medium">
                                        {format(new Date(item.date), "d MMMM yyyy", { locale: it })}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 px-4 pb-4">
                                <RenderItemDetails item={item} />
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RenderItemDetails({ item }: { item: TimelineItem }) {
    const { data } = item;
    
    if (item.type === 'LOG') {
        return (
            <div className="grid gap-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex justify-between md:justify-start md:gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 min-w-[100px]"><Truck className="h-3 w-3"/> Percorso:</span>
                        <span className="font-medium">{data.route || "N/D"}</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:gap-2">
                        <span className="text-muted-foreground min-w-[100px]">Km:</span>
                        <span>{data.initialKm} → {data.finalKm || "?"} ({data.finalKm ? data.finalKm - data.initialKm : "?"} km)</span>
                    </div>
                </div>
                <div className="flex justify-between md:justify-start md:gap-2">
                    <span className="text-muted-foreground flex items-center gap-1 min-w-[100px]"><User className="h-3 w-3"/> Autista:</span>
                    <span>{data.user?.name || "N/D"}</span>
                </div>
                {data.notes && (
                    <div className="mt-2 bg-muted/50 p-2 rounded text-xs italic">
                        &quot;{data.notes}&quot;
                    </div>
                )}
            </div>
        );
    }
    
    if (item.type === 'REFUEL') {
        return (
            <div className="grid gap-2 text-sm">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex justify-between md:justify-start md:gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 min-w-[100px]"><Fuel className="h-3 w-3"/> Quantità:</span>
                        <span className="font-medium">{data.liters} L (€ {data.cost?.toFixed(2)})</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:gap-2">
                        <span className="text-muted-foreground min-w-[100px]">Km Veicolo:</span>
                        <span>{data.mileage}</span>
                    </div>
                </div>
                 <div className="flex justify-between md:justify-start md:gap-2">
                    <span className="text-muted-foreground flex items-center gap-1 min-w-[100px]"><User className="h-3 w-3"/> Utente:</span>
                    <span>{data.user?.name || "N/D"}</span>
                </div>
                 {data.notes && (
                    <div className="mt-2 bg-muted/50 p-2 rounded text-xs italic">
                        &quot;{data.notes}&quot;
                    </div>
                )}
            </div>
        );
    }

    if (item.type === 'MAINTENANCE') {
        return (
            <div className="grid gap-2 text-sm">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex justify-between md:justify-start md:gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 min-w-[100px]"><Wrench className="h-3 w-3"/> Tipo:</span>
                        <span className="font-medium">{data.type}</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:gap-2">
                        <span className="text-muted-foreground min-w-[100px]">Costo:</span>
                        <span>{data.cost ? `€ ${data.cost}` : "N/D"}</span>
                    </div>
                </div>
                <div className="flex justify-between md:justify-start md:gap-2">
                    <span className="text-muted-foreground min-w-[100px]">Km Veicolo:</span>
                    <span>{data.mileage}</span>
                </div>
                 {data.notes && (
                    <div className="mt-2 bg-muted/50 p-2 rounded text-xs italic">
                        &quot;{data.notes}&quot;
                    </div>
                )}
            </div>
        );
    }

    if (item.type === 'MILEAGE_CHECK') {
        return (
            <div className="grid gap-2 text-sm">
                 <div className="flex justify-between md:justify-start md:gap-2">
                    <span className="text-muted-foreground flex items-center gap-1 min-w-[100px]"><FileCheck className="h-3 w-3"/> Km Verificati:</span>
                    <span className="font-bold text-lg">{data.km}</span>
                </div>
                 <div className="flex justify-between md:justify-start md:gap-2">
                    <span className="text-muted-foreground flex items-center gap-1 min-w-[100px]"><User className="h-3 w-3"/> Verificato da:</span>
                    <span>{data.user?.name || "N/D"}</span>
                </div>
                {data.notes && (
                    <div className="mt-2 bg-muted/50 p-2 rounded text-xs italic">
                        &quot;{data.notes}&quot;
                    </div>
                )}
            </div>
        );
    }

    return null;
}
