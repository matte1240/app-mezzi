"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      // Use current origin to avoid localhost redirect issues
      const callbackUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/`
        : '/';
      await signOut({ callbackUrl });
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Disconnessione...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Esci
        </>
      )}
    </button>
  );
}
