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

// Time entry data transfer object
export type TimeEntryDTO = {
  id: string;
  userId: string;
  workDate: string;
  hoursWorked: number;
  overtimeHours?: number;
  permessoHours?: number;
  sicknessHours?: number;
  vacationHours?: number;
  morningStart?: string | null;
  morningEnd?: string | null;
  afternoonStart?: string | null;
  afternoonEnd?: string | null;
  medicalCertificate?: string | null;
  notes?: string | null;
};

export type LeaveType = "VACATION" | "SICKNESS" | "PERMESSO";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveRequestDTO = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  status: RequestStatus;
  reason?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  createdAt: string;
  user?: {
    name: string | null;
    email: string;
  };
};


export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE";

export type Vehicle = {
  id: string;
  plate: string;
  name: string;
  type: string;
  status: VehicleStatus;
  notes?: string | null;
  serviceIntervalKm: number;
  registrationDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
