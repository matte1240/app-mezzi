"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import type { User } from "@/types/models";
import StatsCard from "./stats-card";
import { 
  Clock, 
  Briefcase, 
  Calendar, 
  Stethoscope, 
  UserCog 
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserAggregate = User & {
  regularHours: number;
  overtimeHours: number;
  permessoHours: number;
  sicknessHours: number;
  vacationHours: number;
};

type AdminOverviewProps = {
  users: UserAggregate[];
};

export default function AdminOverview({ users }: AdminOverviewProps) {
  const now = new Date();
  const currentMonth = format(now, "MMMM yyyy", { locale: it });

  // Calculate leaderboard using useMemo to avoid setState in effect
  const leaderboardData = useMemo(() => {
    let maxHours = -1; let maxHoursId: string | null = null;
    let maxOver = -1; let maxOverId: string | null = null;
    let maxPerm = -1; let maxPermId: string | null = null;
    let maxSick = -1; let maxSickId: string | null = null;

    for (const user of users) {
      const total = user.regularHours + user.overtimeHours;
      if (total > maxHours) { 
        maxHours = total; 
        maxHoursId = user.id; 
      }
      if (user.overtimeHours > maxOver) { 
        maxOver = user.overtimeHours; 
        maxOverId = user.id; 
      }
      const permsum = user.permessoHours + user.vacationHours;
      if (permsum > maxPerm) { 
        maxPerm = permsum; 
        maxPermId = user.id; 
      }
      if (user.sicknessHours > maxSick) { 
        maxSick = user.sicknessHours; 
        maxSickId = user.id; 
      }
    }

    const findName = (id: string | null) => {
      if (!id) return '—';
      const u = users.find((x) => x.id === id);
      return u ? (u.name || u.email) : id;
    };

    return {
      topHoursUser: maxHoursId ? { id: maxHoursId, name: findName(maxHoursId), value: Math.max(0, maxHours) } : null,
      topOvertimeUser: maxOverId ? { id: maxOverId, name: findName(maxOverId), value: Math.max(0, maxOver) } : null,
      topPermessoUser: maxPermId ? { id: maxPermId, name: findName(maxPermId), value: Math.max(0, maxPerm) } : null,
      topSicknessUser: maxSickId ? { id: maxSickId, name: findName(maxSickId), value: Math.max(0, maxSick) } : null,
    };
  }, [users]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Leaderboard Cards (mese corrente) */}
      <div className="grid gap-6 md:grid-cols-4 order-2 md:order-1">
        <StatsCard
          title={`Più Ore (${currentMonth})`}
          value={leaderboardData.topHoursUser ? leaderboardData.topHoursUser.name : '—'}
          color="green"
          icon={<Clock className="h-6 w-6" />}
        />

        <StatsCard
          title="Più Straordinarie"
          value={leaderboardData.topOvertimeUser ? leaderboardData.topOvertimeUser.name : '—'}
          color="orange"
          icon={<Briefcase className="h-6 w-6" />}
        />

        <StatsCard
          title="Più Perm/Ferie"
          value={leaderboardData.topPermessoUser ? leaderboardData.topPermessoUser.name : '—'}
          color="purple"
          icon={<Calendar className="h-6 w-6" />}
        />

        <StatsCard
          title="Più Malattia (ore)"
          value={leaderboardData.topSicknessUser ? leaderboardData.topSicknessUser.name : '—'}
          color="red"
          icon={<Stethoscope className="h-6 w-6" />}
        />
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden order-1 md:order-2">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Utenti e Ore Lavorate</h2>
          <Link
            href="/dashboard/users"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm"
          >
            <UserCog className="h-4 w-4 mr-2" />
            Gestisci Utenti
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Utente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Ruolo
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ore Totali
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ore Straordinarie
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ore Perm/Ferie
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ore Malattia
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {users.map((user) => {
                const totalUserHours = user.regularHours + user.overtimeHours;
                return (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {user.image ? (
                            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                          ) : (
                            <span className="text-muted-foreground font-semibold text-sm">
                              {(user.name || user.email || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {user.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={cn(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        {user.role === "ADMIN" ? "Amministratore" : "Dipendente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-foreground">
                        {totalUserHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        {user.overtimeHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        {(user.permessoHours + user.vacationHours).toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {user.sicknessHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        href={`/dashboard/calendar?userId=${user.id}`}
                        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                      >
                        Vedi Calendario
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
