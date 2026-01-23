"use client";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, FileText } from "lucide-react";

type InsuranceDoc = {
    id: string;
    expiryDate: Date | null;
    vehicle: { plate: string; name: string };
    fileUrl: string;
};

export default function InsurancesList({ documents }: { documents: InsuranceDoc[] }) {
    // Sort by expiry date ascending
    const sorted = [...documents].sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    const getStatusParams = (date: Date | null) => {
        if (!date) return { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "N/D" };
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { color: "bg-destructive/10 text-destructive", label: "SCADUTA" };
        if (diffDays < 30) return { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", label: "In Scadenza" };
        return { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Valida" };
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sorted.length === 0 && <div className="col-span-full text-center text-muted-foreground">Nessuna assicurazione trovata.</div>}
            {sorted.map(doc => {
                const status = getStatusParams(doc.expiryDate);
                return (
                    <Card key={doc.id}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-lg flex items-center gap-2">
                                    <Car className="h-4 w-4 text-muted-foreground" />
                                    {doc.vehicle.plate}
                                </div>
                                <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">{doc.vehicle.name}</div>
                            
                            <div className="flex items-center gap-2 text-sm pt-2 border-t">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                    Scadenza: {doc.expiryDate ? format(doc.expiryDate, "d MMMM yyyy", { locale: it }) : "Non definita"}
                                </span>
                            </div>
                            
                             <div className="mt-4">
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                    Vedi Documento &rarr;
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
