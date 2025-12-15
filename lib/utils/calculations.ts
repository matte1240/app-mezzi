/**
 * Utility functions for calculations (hours, totals, etc.)
 */

import type { TimeEntryDTO } from "@/types/models";

/**
 * Calculate total hours from a list of time entries
 * @param entries Array of time entries
 * @returns Object with calculated totals
 */
export function calculateTotalsFromEntries(entries: TimeEntryDTO[]) {
  const totalHours = entries.reduce(
    (sum, entry) => sum + (entry.hoursWorked ?? 0) + (entry.overtimeHours ?? 0),
    0
  );
  const totalOvertimeHours = entries.reduce(
    (sum, entry) => sum + (entry.overtimeHours ?? 0),
    0
  );
  const totalPermFerieHours = entries.reduce(
    (sum, entry) => sum + (entry.permessoHours ?? 0) + (entry.vacationHours ?? 0),
    0
  );
  const totalSicknessHours = entries.reduce(
    (sum, entry) => sum + (entry.sicknessHours ?? 0),
    0
  );

  return {
    totalHours,
    totalOvertimeHours,
    totalPermFerieHours,
    totalSicknessHours,
  };
}
