/**
 * Data transformation utilities for converting Prisma types to JSON-safe types
 */

import type { Decimal } from "@prisma/client/runtime/library";

/**
 * Convert Prisma Decimal to number
 * Safe for JSON serialization
 */
export function decimalToNumber(decimal: Decimal | null | undefined): number {
  if (decimal === null || decimal === undefined) {
    return 0;
  }
  return parseFloat(decimal.toString());
}


