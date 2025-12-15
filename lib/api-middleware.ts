/**
 * API middleware utilities for common request handling patterns
 */

import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getAuthSession } from "@/lib/auth";
import { isAdmin as checkIsAdmin } from "@/lib/utils/user-utils";

// Re-export isAdmin for convenience
export { isAdmin } from "@/lib/utils/user-utils";

/**
 * Require authentication and return the session
 * Returns an error response if not authenticated
 */
export async function requireAuth(): Promise<
  { session: Session; error: null } | { session: null; error: NextResponse }
> {
  const session = await getAuthSession();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, error: null };
}

/**
 * Require admin authentication
 * Returns an error response if not authenticated or not admin
 */
export async function requireAdmin(): Promise<
  { session: Session; error: null } | { session: null; error: NextResponse }
> {
  const session = await getAuthSession();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!checkIsAdmin(session)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
