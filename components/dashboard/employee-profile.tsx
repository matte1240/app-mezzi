"use client";

import { useState, useTransition, useRef } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { useSession } from "next-auth/react";
import type { User } from "@/types/models";
import { 
  Camera, 
  Shield,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

type EmployeeProfileProps = {
  user: User;
};

export default function EmployeeProfile({ user }: EmployeeProfileProps) {
  const { update } = useSession();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, startUpdating] = useTransition();
  
  // Image upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(user.image);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`/api/users/${user.id}/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setAvatarUrl(data.imageUrl);
      setSuccess("Immagine profilo aggiornata!");
      
      // Update session to reflect new image in navbar
      await update();
      
      // Force a router refresh to update server components if needed
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Errore durante il caricamento dell'immagine");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Le password non corrispondono");
      return;
    }

    if (newPassword.length < 8) {
      setError("La password deve essere lunga almeno 8 caratteri");
      return;
    }

    startUpdating(async () => {
      try {
        const response = await fetch(`/api/users/${user.id}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Errore nel cambio password");
          return;
        }

        setSuccess("Password cambiata con successo!");
        setIsEditingPassword(false);
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        console.error(err);
        setError("Errore imprevisto");
      }
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:px-12 md:py-8 pt-6">
      {/* Profile Header */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-primary/80 to-primary h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-16 mb-4">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-background shadow-lg border-4 border-background overflow-hidden group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={user.name || "Profile"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-5xl font-bold text-muted-foreground">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Overlay for upload */}
              <div 
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Spinner size="lg" className="text-white" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.name || "N/A"}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-2">
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold",
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              )}>
                {user.role === "ADMIN" ? "Amministratore" : "Dipendente"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert variant="success" className="mb-6">{success}</Alert>
      )}

      {error && (
        <Alert variant="error" className="mb-6">{error}</Alert>
      )}

      {/* Profile Information */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-muted-foreground" />
          Informazioni Profilo
        </h2>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nome completo</dt>
            <dd className="mt-1 text-sm text-foreground">{user.name || "N/A"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Ruolo</dt>
            <dd className="mt-1 text-sm text-foreground">{user.role === "ADMIN" ? "Amministratore" : "Dipendente"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Data registrazione</dt>
            <dd className="mt-1 text-sm text-foreground">
              {format(new Date(user.createdAt), "dd MMMM yyyy")}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Security Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              Sicurezza
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Gestisci la tua password</p>
          </div>
          {!isEditingPassword && (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer"
            >
              Cambia Password
            </button>
          )}
        </div>

        {isEditingPassword && (
          <form onSubmit={handlePasswordChange} className="border-t border-border pt-4 space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                Nuova Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Minimo 8 caratteri"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Conferma Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ripeti la password"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isUpdating ? "Salvataggio..." : "Salva Password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingPassword(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setError(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-lg text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </form>
        )}

        {!isEditingPassword && (
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Password configurata. Usa il pulsante sopra per cambiarla.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}