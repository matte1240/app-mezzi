/**
 * Shared types for the employee management application
 * Centralized type definitions to avoid duplication across components
 */

// User roles
export type UserRole = "EMPLOYEE" | "ADMIN";

// Base user type
export type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  image?: string | null;
  createdAt: Date;
};


export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE";
export type OwnershipType = "OWNED" | "RENTAL";

export type Vehicle = {
  id: string;
  plate: string;
  name: string;
  type: string;
  status: VehicleStatus;
  ownershipType: OwnershipType;
  currentAnomaly?: string | null;
  notes?: string | null;
  serviceIntervalKm: number;
  registrationDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
