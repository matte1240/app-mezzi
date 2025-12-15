"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  useCallback,
} from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { it } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  AlertCircle,
  Sun,
  Stethoscope,
  XCircle,
  Loader2,
  Plus,
} from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";
import StatsCard from "./stats-card";
import type { TimeEntryDTO, LeaveRequestDTO } from "@/types/models";
import { calculateHours, TIME_OPTIONS } from "@/lib/utils/time-utils";
import { isDateEditable as isDateEditableUtil } from "@/lib/utils/date-utils";
import { isHoliday, getHolidayName } from "@/lib/utils/holiday-utils";
import RequestLeaveModal from "./request-leave-modal";
import { cn } from "@/lib/utils";

// Re-export for backward compatibility
export type { TimeEntryDTO };

type EmployeeDashboardProps = {
  initialEntries: TimeEntryDTO[];
  userName: string;
  hideHeader?: boolean; // If true, hide the header (for embedded views)
  hideStats?: boolean; // If true, hide the stats cards (for admin views with separate totals)
  targetUserId?: string; // If set, admin is editing this user's calendar
  onEntrySaved?: (updatedEntries: TimeEntryDTO[]) => void; // Callback when entry is saved/deleted (for admin refetch)
  isAdmin?: boolean; // If true, bypass Sunday restriction
};

type ModalFormState = {
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  notes: string;
  dayType: "normal" | "ferie" | "malattia";
  medicalCertificate: string;
  isMorningPermesso: boolean;
  isAfternoonPermesso: boolean;
};

export default function TimesheetCalendar({
  initialEntries,
  userName,
  hideHeader = false,
  hideStats = false,
  targetUserId,
  onEntrySaved,
  isAdmin = false,
}: EmployeeDashboardProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [entries, setEntries] = useState<TimeEntryDTO[]>(initialEntries);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const hasFetched = useRef(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [requests, setRequests] = useState<LeaveRequestDTO[]>([]);
  const [modalForm, setModalForm] = useState<ModalFormState>({
    morningStart: "08:00",
    morningEnd: "12:00",
    afternoonStart: "14:00",
    afternoonEnd: "18:30",
    notes: "",
    dayType: "normal",
    medicalCertificate: "",
    isMorningPermesso: false,
    isAfternoonPermesso: false,
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    date: string;
    visible: boolean;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Month picker state
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // Generate year/month options for picker
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 3;
  const endYear = currentYear + 3;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  const months = [
    "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
    "Lug", "Ago", "Set", "Ott", "Nov", "Dic"
  ];

  // Unified function to fetch entries
  const fetchEntries = useCallback(async (signal?: AbortSignal) => {
    setIsFetching(true);
    setError(null);
    try {
      const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const url = targetUserId
        ? `/api/hours?userId=${targetUserId}&from=${from}&to=${to}`
        : `/api/hours?from=${from}&to=${to}`;
      const response = await fetch(url, {
        signal,
      });

      if (response.status === 401) {
        router.push("/");
        return;
      }

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load entries.");
      }

      setEntries(payload as TimeEntryDTO[]);
      onEntrySaved?.(payload as TimeEntryDTO[]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error("Error fetching entries:", err);
      setError("Failed to load entries");
    } finally {
      setIsFetching(false);
      setIsRefetching(false);
    }
  }, [currentMonth, targetUserId, router, onEntrySaved]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu?.visible]);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isModalOpen]);

  // Reset times and notes when switching to normal, ferie, or malattia
  useEffect(() => {
    if (modalForm.dayType === "normal") {
      setModalForm(f => ({
        ...f,
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:30",
        notes: "",
        isMorningPermesso: false,
        isAfternoonPermesso: false,
      }));
    } else if (modalForm.dayType === "ferie" || modalForm.dayType === "malattia") {
      setModalForm(f => ({
        ...f,
        notes: "",
      }));
    }
  }, [modalForm.dayType]);

  // Refetch entries when needed
  useEffect(() => {
    if (!isRefetching) return;

    const controller = new AbortController();
    fetchEntries(controller.signal);

    return () => controller.abort();
  }, [isRefetching, fetchEntries, onEntrySaved]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      return;
    }

    const controller = new AbortController();
    fetchEntries(controller.signal);

    return () => controller.abort();
  }, [fetchEntries, onEntrySaved]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`/api/requests?${targetUserId ? `userId=${targetUserId}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (error) {
        console.error("Failed to fetch requests", error);
      }
    };
    fetchRequests();
  }, [targetUserId, isRefetching]);

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "PENDING"), [requests]);
  const approvedRequests = useMemo(() => requests.filter((r) => r.status === "APPROVED"), [requests]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntryDTO[]>();
    for (const entry of entries) {
      const key = entry.workDate; // Already in YYYY-MM-DD format
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }

    for (const [, bucket] of map) {
      bucket.sort((a, b) => a.workDate.localeCompare(b.workDate));
    }

    return map;
  }, [entries]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Memoize holiday checks for all calendar days to avoid redundant calculations
  const holidayMap = useMemo(() => {
    const map = new Map<string, { isHoliday: boolean; name: string | undefined }>();
    for (const day of calendarDays) {
      const dateKey = format(day, 'yyyy-MM-dd');
      const isHolidayDay = isHoliday(day);
      const holidayName = isHolidayDay ? getHolidayName(day) : undefined;
      map.set(dateKey, { isHoliday: isHolidayDay, name: holidayName });
    }
    return map;
  }, [calendarDays]);

  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.hoursWorked + (entry.overtimeHours ?? 0), 0),
    [entries]
  );

  const totalOvertime = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.overtimeHours ?? 0), 0),
    [entries]
  );

  const totalPermFerie = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.permessoHours ?? 0) + (entry.vacationHours ?? 0), 0),
    [entries]
  );

  const totalSickness = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.sicknessHours ?? 0), 0),
    [entries]
  );

  // Calculate hours from modal form
  const calculatedHours = useMemo(() => {
    const morningWorked = modalForm.isMorningPermesso ? 0 : calculateHours(modalForm.morningStart, modalForm.morningEnd);
    const afternoonWorked = modalForm.isAfternoonPermesso ? 0 : calculateHours(modalForm.afternoonStart, modalForm.afternoonEnd);
    
    const totalWorked = morningWorked + afternoonWorked;
    let overlap = 0;

    // Check for approved permission requests for this day
    if (selectedDate) {
      const approvedPermission = approvedRequests.find(req => {
        if (req.type !== 'PERMESSO') return false;
        const start = new Date(req.startDate);
        return format(start, 'yyyy-MM-dd') === selectedDate;
      });

      if (approvedPermission && approvedPermission.startTime && approvedPermission.endTime) {
        const reqStart = approvedPermission.startTime;
        const reqEnd = approvedPermission.endTime;
        
        // Calculate overlap with morning shift
        if (!modalForm.isMorningPermesso && modalForm.morningStart && modalForm.morningEnd) {
          overlap += calculateOverlap(
            modalForm.morningStart, modalForm.morningEnd,
            reqStart, reqEnd
          );
        }

        // Calculate overlap with afternoon shift
        if (!modalForm.isAfternoonPermesso && modalForm.afternoonStart && modalForm.afternoonEnd) {
          overlap += calculateOverlap(
            modalForm.afternoonStart, modalForm.afternoonEnd,
            reqStart, reqEnd
          );
        }
      }
    }
    
    // Subtract overlap from worked hours
    const netWork = Math.max(0, totalWorked - overlap);
    
    let regular = 0;
    let overtime = 0;
    let permesso = 0;
    
    if (selectedDate && modalForm.dayType === "normal") {
      const dateObj = new Date(`${selectedDate}T12:00:00`);
      const dayOfWeek = getDay(dateObj);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHol = isHoliday(dateObj);
      
      if (isWeekend || isHol) {
        // On weekends/holidays, all worked hours are overtime
        regular = 0;
        overtime = netWork;
        permesso = 0;
      } else {
        // Weekdays
        if (netWork < 8) {
          regular = netWork;
          permesso = 8 - netWork;
          overtime = 0;
        } else {
          regular = 8;
          permesso = 0;
          overtime = netWork - 8;
        }
      }
    }

    return { 
      morning: modalForm.isMorningPermesso ? 4 : morningWorked, 
      afternoon: modalForm.isAfternoonPermesso ? 4 : afternoonWorked, 
      totalWorked: netWork, 
      regular, 
      overtime, 
      permesso 
    };
  }, [modalForm.morningStart, modalForm.morningEnd, modalForm.afternoonStart, modalForm.afternoonEnd, modalForm.isMorningPermesso, modalForm.isAfternoonPermesso, modalForm.dayType, selectedDate, approvedRequests]);

  const activePerm = useMemo(() => {
    if (!selectedDate) return null;
    return approvedRequests.find(req => 
      req.type === 'PERMESSO' && 
      format(new Date(req.startDate), 'yyyy-MM-dd') === selectedDate
    );
  }, [selectedDate, approvedRequests]);

  // Helper to calculate overlap between two time ranges (HH:MM)
  function calculateOverlap(start1: string, end1: string, start2: string, end2: string): number {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    const start = Math.max(s1, s2);
    const end = Math.min(e1, e2);

    if (start < end) {
      return (end - start) / 60;
    }
    return 0;
  }

  // Check if date is editable
  const isDateEditable = (date: Date): boolean => {
    return isDateEditableUtil(date, isAdmin);
  };

  const handleDayClick = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    
    // Check if it's Sunday or Holiday (only for employees)
    if (!isAdmin) {
      const dayOfWeek = day.getDay();
      const dateKey = format(day, 'yyyy-MM-dd');
      const holidayInfo = holidayMap.get(dateKey);
      if (dayOfWeek === 0 || holidayInfo?.isHoliday) {
        setError("Non è possibile inserire ore la domenica o nei giorni festivi.");
        return;
      }
    }
    
    if (!isDateEditable(day)) {
      const currentDay = new Date().getDate();
      const errorMessage = currentDay <= 5
        ? "È possibile inserire ore per il mese corrente fino ad oggi o per il mese precedente (fino al 5 del mese corrente)."
        : "È possibile inserire ore solo per il mese corrente fino ad oggi.";
      setError(errorMessage);
      return;
    }

    const dateStr = format(day, "yyyy-MM-dd");
    setSelectedDate(dateStr);

    // Check if entry exists for this day and pre-fill
    const existingEntry = entries.find(e => e.workDate === dateStr);
    if (existingEntry) {
      let dayType: "normal" | "ferie" | "malattia" = "normal";
      let medicalCertificate = "";
      if ((existingEntry.vacationHours ?? 0) > 0) {
        dayType = "ferie";
      } else if ((existingEntry.sicknessHours ?? 0) > 0) {
        dayType = "malattia";
        medicalCertificate = existingEntry.medicalCertificate || "";
      }
      
      const isMorningPermesso = existingEntry.morningStart === "PERM";
      const isAfternoonPermesso = existingEntry.afternoonStart === "PERM";
      
      setModalForm({
        morningStart: isMorningPermesso ? "08:00" : (existingEntry.morningStart || "08:00"),
        morningEnd: isMorningPermesso ? "12:00" : (existingEntry.morningEnd || "12:00"),
        afternoonStart: isAfternoonPermesso ? "14:00" : (existingEntry.afternoonStart || "14:00"),
        afternoonEnd: isAfternoonPermesso ? "18:30" : (existingEntry.afternoonEnd || "18:30"),
        notes: existingEntry.notes || "",
        dayType,
        medicalCertificate,
        isMorningPermesso,
        isAfternoonPermesso,
      });
    } else {
      setModalForm({
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:30",
        notes: "",
        dayType: "normal",
        medicalCertificate: "",
        isMorningPermesso: false,
        isAfternoonPermesso: false,
      });
    }
    
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError(null);

    if (modalForm.dayType === "normal" && calculatedHours.totalWorked === 0 && calculatedHours.permesso === 0) {
      setModalError("Inserisci ore di lavoro o permesso valide.");
      return;
    }

    if (!selectedDate) return;

    let payload: Record<string, unknown>;
    if (modalForm.dayType === "ferie") {
      payload = {
        workDate: selectedDate,
        hoursWorked: 0,
        overtimeHours: 0,
        permessoHours: 0,
        sicknessHours: 0,
        vacationHours: 8,
        notes: modalForm.notes.trim() || null,
        ...(targetUserId && { userId: targetUserId }),
      };
    } else if (modalForm.dayType === "malattia") {
      payload = {
        workDate: selectedDate,
        hoursWorked: 0,
        overtimeHours: 0,
        permessoHours: 0,
        sicknessHours: 8,
        vacationHours: 0,
        medicalCertificate: modalForm.medicalCertificate || null,
        notes: modalForm.notes.trim() || null,
        ...(targetUserId && { userId: targetUserId }),
      };
    } else {
      payload = {
        workDate: selectedDate,
        hoursWorked: calculatedHours.regular,
        overtimeHours: calculatedHours.overtime,
        permessoHours: calculatedHours.permesso,
        morningStart: modalForm.isMorningPermesso ? "PERM" : modalForm.morningStart || undefined,
        morningEnd: modalForm.isMorningPermesso ? "PERM" : modalForm.morningEnd || undefined,
        afternoonStart: modalForm.isAfternoonPermesso ? "PERM" : modalForm.afternoonStart || undefined,
        afternoonEnd: modalForm.isAfternoonPermesso ? "PERM" : modalForm.afternoonEnd || undefined,
        notes: modalForm.notes.trim() || null,
        ...(targetUserId && { userId: targetUserId }),
      };
    }

    startSaving(async () => {
      try {
        const response = await fetch("/api/hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setModalError(data?.error ?? "Impossibile salvare l'inserimento.");
          return;
        }

        // Calculate new entries
        const newEntries = (() => {
          const filtered = entries.filter(e => e.workDate !== selectedDate);
          return [...filtered, data as TimeEntryDTO];
        })();

        onEntrySaved?.(newEntries); // Trigger refetch in admin dashboard
        setEntries(newEntries);

        setIsModalOpen(false);
        setIsRefetching(true);
      } catch {
        setModalError("Errore imprevisto durante il salvataggio.");
      }
    });
  };

  const handleDelete = () => {
    if (!selectedDate) return;

    const entry = entries.find(e => e.workDate === selectedDate);
    if (!entry) return;

    if (!confirm("Sei sicuro di voler eliminare questo inserimento?")) return;

    setModalError(null);

    startSaving(async () => {
      try {
        const response = await fetch(`/api/hours?id=${entry.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          setModalError(data?.error ?? "Impossibile eliminare l'inserimento.");
          return;
        }

        // Use functional updater to ensure we operate on latest state
        setEntries((prev) => {
          const newEntries = prev.filter((e) => e.id !== entry.id);
          onEntrySaved?.(newEntries); // Trigger refetch in admin dashboard with latest entries
          return newEntries;
        });

        setIsModalOpen(false);
        setIsRefetching(true);
      } catch {
        setModalError("Errore imprevisto durante l'eliminazione.");
      }
    });
  };

  const handleFerie = async (date: string) => {
    setContextMenu(null);
    setError(null);

    const payload = {
      workDate: date,
      hoursWorked: 0,
      overtimeHours: 0,
      permessoHours: 0,
      sicknessHours: 0,
      vacationHours: 8,
      ...(targetUserId && { userId: targetUserId }),
    };

    try {
      const response = await fetch("/api/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "Errore nel salvare le ferie.");
        return;
      }

      // Calculate new entries
      const newEntries = (() => {
        const filtered = entries.filter(e => e.workDate !== date);
        return [...filtered, data as TimeEntryDTO];
      })();

      onEntrySaved?.(newEntries);
      setEntries(newEntries);

      router.refresh();
    } catch {
      setError("Errore imprevisto durante il salvataggio delle ferie.");
    }
  };

  const handleMalattia = async (date: string) => {
    setContextMenu(null);
    setError(null);

    const payload = {
      workDate: date,
      hoursWorked: 0,
      overtimeHours: 0,
      permessoHours: 0,
      sicknessHours: 8,
      vacationHours: 0,
      ...(targetUserId && { userId: targetUserId }),
    };

    try {
      const response = await fetch("/api/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "Errore nel salvare la malattia.");
        return;
      }

      // Calculate new entries
      const newEntries = (() => {
        const filtered = entries.filter(e => e.workDate !== date);
        return [...filtered, data as TimeEntryDTO];
      })();

      onEntrySaved?.(newEntries);
      setEntries(newEntries);

      router.refresh();
    } catch {
      setError("Errore imprevisto durante il salvataggio della malattia.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with logo - hide in embedded views */}
      {!hideHeader && (
        <header className="border-b border-border bg-card shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-6">
              <Image
                src="/logo.svg"
                alt="Ivicolors"
                width={140}
                height={35}
                className="h-9 w-auto"
                priority
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">
                  Benvenuto, {userName.split(" ")[0] ?? userName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestisci le tue ore di lavoro
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </header>
      )}

      <div
        className={cn(
          "flex flex-col gap-6",
          hideHeader ? "w-full pb-8" : "mx-auto w-full max-w-7xl px-4 sm:px-6 py-8"
        )}
      >
        {/* Stats cards - on mobile, show after calendar */}
        {!hideStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 order-2 sm:order-1">
            <StatsCard
              title="Totale Mese"
              value={totalHours.toFixed(1)}
              color="blue"
              icon={<Clock className="h-5 w-5" />}
            />

            {totalOvertime > 0 && (
              <StatsCard
                title="Straordinario"
                value={totalOvertime.toFixed(1)}
                color="orange"
                icon={<Briefcase className="h-5 w-5" />}
              />
            )}

            <StatsCard
              title="Ore Perm/Ferie"
              value={totalPermFerie.toFixed(1)}
              color="purple"
              icon={<CalendarIcon className="h-5 w-5" />}
            />

            {totalSickness > 0 && (
              <StatsCard
                title="Malattia"
                value={totalSickness.toFixed(1)}
                color="red"
                icon={<Stethoscope className="h-5 w-5" />}
              />
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 animate-in fade-in slide-in-from-top-2 order-3 sm:order-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Calendar section */}
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden order-1 sm:order-3">
          <div className="border-b border-border px-4 sm:px-6 py-4 bg-muted/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative z-20">
                <button
                  type="button"
                  onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                  className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors capitalize"
                >
                  <span>
                    {format(currentMonth, "MMMM yyyy", { locale: it })}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200",
                      isMonthPickerOpen && "rotate-180"
                    )}
                  />
                </button>
                {isFetching && (
                  <p className="absolute -bottom-5 left-0 text-[10px] text-muted-foreground animate-pulse">
                    Aggiornamento...
                  </p>
                )}

                {isMonthPickerOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMonthPickerOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-72 rounded-lg border border-border bg-popover p-4 shadow-lg animate-in fade-in zoom-in-95 duration-100 z-30">
                      {/* Year selector */}
                      <select
                        value={currentMonth.getFullYear()}
                        onChange={(e) => {
                          const newYear = parseInt(e.target.value);
                          const newDate = new Date(currentMonth);
                          newDate.setFullYear(newYear);
                          setCurrentMonth(newDate);
                        }}
                        className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>

                      {/* Month grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {months.map((month, idx) => {
                          const isSelected = idx === currentMonth.getMonth();

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                const newDate = new Date(currentMonth);
                                newDate.setMonth(idx);
                                setCurrentMonth(newDate);
                                setIsMonthPickerOpen(false);
                              }}
                              className={cn(
                                "rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                              )}
                            >
                              {month}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="hidden sm:inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 mr-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Richiedi Ferie
                </button>
                <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth((month) => addMonths(month, -1))
                    }
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground h-8 px-3 text-foreground"
                  >
                    Oggi
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth((month) => addMonths(month, 1))
                    }
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-card">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-3">
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const bucket = entriesByDay.get(key);
                const dayEntry = bucket?.[0];
                const regularHours = dayEntry?.hoursWorked ?? 0;
                const overtimeHours = dayEntry?.overtimeHours ?? 0;
                const totalHours = regularHours + overtimeHours;
                const isFerie = (dayEntry?.vacationHours ?? 0) > 0;
                const isMalattia = (dayEntry?.sicknessHours ?? 0) > 0;
                const hasEntries = Boolean(dayEntry);
                const highlight = isSameDay(day, new Date());
                const editable =
                  isDateEditable(day) && isSameMonth(day, currentMonth);
                const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
                const isSaturday = dayOfWeek === 6;
                const isSunday = dayOfWeek === 0;
                const dateKey = format(day, "yyyy-MM-dd");
                const holidayInfo = holidayMap.get(dateKey);
                const isHolidayDay = holidayInfo?.isHoliday ?? false;
                const holidayName = holidayInfo?.name;

                const pendingRequest = pendingRequests.find((req) => {
                  const start = new Date(req.startDate);
                  const end = new Date(req.endDate);
                  // Reset hours to compare dates only
                  start.setHours(0, 0, 0, 0);
                  end.setHours(0, 0, 0, 0);
                  const current = new Date(day);
                  current.setHours(0, 0, 0, 0);
                  return current >= start && current <= end;
                });

                const approvedRequest = approvedRequests.find((req) => {
                  const start = new Date(req.startDate);
                  const end = new Date(req.endDate);
                  start.setHours(0, 0, 0, 0);
                  end.setHours(0, 0, 0, 0);
                  const current = new Date(day);
                  current.setHours(0, 0, 0, 0);
                  return current >= start && current <= end && req.type === 'PERMESSO';
                });

                // Calculate permesso hours
                let permessoHours = 0;
                if (hasEntries) {
                  // Use permessoHours from database entry
                  permessoHours = dayEntry?.permessoHours ?? 0;
                } else {
                  // Calculate for days without entry
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  const isWeekday =
                    dayOfWeek >= 1 && dayOfWeek <= 5 && !isHolidayDay;
                  const isPastOrYesterday = day <= yesterday;
                  const isInCurrentMonth = isSameMonth(day, currentMonth);

                  if (isWeekday && isPastOrYesterday && isInCurrentMonth) {
                    permessoHours = 8; // Full day permesso for empty weekdays in the past
                  }
                }

                // Determine missing entry indicator
                const isMissingEntry = permessoHours === 8 && !hasEntries;

                // Determine explicit permesso
                const isPermesso = (hasEntries && permessoHours > 0) || !!approvedRequest;

                let approvedHours = 0;
                if (approvedRequest && approvedRequest.startTime && approvedRequest.endTime) {
                   approvedHours = calculateHours(approvedRequest.startTime, approvedRequest.endTime);
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleDayClick(day)}
                    title={holidayName || undefined}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!editable) return;
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        date: key,
                        visible: true,
                      });
                    }}
                    disabled={!editable}
                    className={cn(
                      "flex min-h-[80px] sm:min-h-[110px] flex-col rounded-xl border p-2 sm:p-3 text-left transition-all duration-200 relative group overflow-hidden",
                      isSameMonth(day, currentMonth)
                        ? editable
                          ? "border-border bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                          : "border-border/40 bg-muted/20 text-muted-foreground cursor-not-allowed"
                        : "border-transparent bg-transparent text-muted-foreground/20",
                      highlight && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl z-10 bg-primary/5",
                      (isSunday || isHolidayDay) &&
                        isSameMonth(day, currentMonth) &&
                        "bg-red-50/30 dark:bg-red-950/10 border-red-100/50 dark:border-red-900/20",
                      isSaturday &&
                        isSameMonth(day, currentMonth) &&
                        "bg-blue-50/30 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/20",
                      pendingRequest &&
                        "bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-100 dark:border-yellow-900/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 w-full">
                      <div className="flex items-center gap-1.5">
                        {isMissingEntry && (
                          <div
                            className="w-2 h-2 rounded-full bg-destructive animate-pulse"
                            title="Mancato inserimento"
                          ></div>
                        )}
                        <span
                          className={cn(
                            "text-xs sm:text-sm font-semibold",
                            highlight
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {isFerie && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            F
                          </span>
                        )}
                        {isMalattia && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            M
                          </span>
                        )}
                        {isPermesso && (
                          <span className="flex h-5 min-w-[1.25rem] px-1 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
                            {hasEntries && permessoHours > 0 
                              ? (permessoHours === 8 ? "P" : `${Number(permessoHours)}h P`) 
                              : (approvedHours > 0 ? (approvedHours === 8 ? "P" : `${Number(approvedHours)}h P`) : "P")
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {hasEntries ? (
                      <div className="flex-1 flex flex-col justify-center items-center gap-1 w-full">
                        <div className="flex flex-col items-center">
                          <div className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                            {totalHours.toFixed(1)}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            ore
                          </div>
                        </div>
                        {dayEntry?.notes && (
                          <div className="w-full max-w-full">
                            <p className="text-[10px] text-muted-foreground truncate w-full text-center opacity-70 px-1">
                              {dayEntry.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : pendingRequest ? (
                      <div className="flex-1 flex flex-col justify-center items-center">
                        <span className="text-[10px] font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                          In Attesa
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-muted-foreground/50">
                          {editable ? (
                            <Plus className="h-5 w-5" />
                          ) : null}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg my-8 rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleModalSubmit}
              className="flex flex-col min-h-0 flex-1"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between bg-primary px-6 py-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-primary-foreground">
                  {selectedDate &&
                    format(
                      new Date(`${selectedDate}T12:00:00`),
                      "EEEE, MMM d, yyyy"
                    )}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-primary-foreground/80 transition hover:bg-primary-foreground/20 hover:text-primary-foreground"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-5 p-6 pb-5 overflow-y-auto flex-1">
                {/* Day type selector */}
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Tipo di giornata
                  </span>
                  <select
                    value={modalForm.dayType}
                    onChange={(e) =>
                      setModalForm((f) => ({
                        ...f,
                        dayType: e.target.value as
                          | "normal"
                          | "ferie"
                          | "malattia",
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="normal">Normale</option>
                    <option value="ferie">Ferie</option>
                    <option value="malattia">Malattia</option>
                  </select>
                </label>

                {/* Medical certificate input - only show for malattia */}
                {modalForm.dayType === "malattia" && (
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Numero certificato medico
                    </span>
                    <input
                      type="text"
                      value={modalForm.medicalCertificate}
                      onChange={(e) =>
                        setModalForm((f) => ({
                          ...f,
                          medicalCertificate: e.target.value,
                        }))
                      }
                      placeholder="Inserisci il numero del certificato..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </label>
                )}
                {modalForm.dayType === "normal" && (
                  <>
                    {activePerm && activePerm.startTime && activePerm.endTime && (
                      <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:bg-yellow-900/10 dark:border-yellow-900/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div className="text-xs text-yellow-800 dark:text-yellow-200">
                            <p className="font-semibold">Permesso Approvato ({activePerm.startTime} - {activePerm.endTime})</p>
                            <p>Le ore di permesso verranno conteggiate automaticamente per coprire le ore mancanti al raggiungimento delle 8 ore lavorative.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Morning shift */}
                    <div className="rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <Sun className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                          Turno Mattina
                        </h3>
                      </div>
                      <div className="mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={modalForm.isMorningPermesso}
                            onChange={(e) =>
                              setModalForm((f) => ({
                                ...f,
                                isMorningPermesso: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                            Permesso Totale Turno (4h)
                          </span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                            Ora inizio
                          </span>
                          <select
                            value={modalForm.morningStart}
                            onChange={(e) =>
                              setModalForm((f) => ({
                                ...f,
                                morningStart: e.target.value,
                              }))
                            }
                            disabled={modalForm.isMorningPermesso}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option
                                key={`morning-start-${time}`}
                                value={time}
                              >
                                {time}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                            Ora fine
                          </span>
                          <select
                            value={modalForm.morningEnd}
                            onChange={(e) =>
                              setModalForm((f) => ({
                                ...f,
                                morningEnd: e.target.value,
                              }))
                            }
                            disabled={modalForm.isMorningPermesso}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={`morning-end-${time}`} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {!modalForm.isMorningPermesso && (
                        <p className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-medium text-blue-700 dark:text-blue-300">
                            Durata:
                          </span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {calculatedHours.morning.toFixed(2)} ore
                          </span>
                        </p>
                      )}
                      {modalForm.isMorningPermesso && (
                        <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                          Queste ore saranno conteggiate come permesso.
                        </p>
                      )}
                    </div>

                    {/* Afternoon shift */}
                    <div className="rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <Sun className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <h3 className="text-sm font-bold text-orange-900 dark:text-orange-100">
                          Turno Pomeriggio
                        </h3>
                      </div>
                      <div className="mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={modalForm.isAfternoonPermesso}
                            onChange={(e) =>
                              setModalForm((f) => ({
                                ...f,
                                isAfternoonPermesso: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-xs font-medium text-orange-800 dark:text-orange-200">
                            Permesso Totale Turno (4h)
                          </span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-orange-800 dark:text-orange-200">
                            Ora inizio
                          </span>
                          <select
                            value={modalForm.afternoonStart}
                            onChange={(e) =>
                              setModalForm((f) => ({
                                ...f,
                                afternoonStart: e.target.value,
                              }))
                            }
                            disabled={modalForm.isAfternoonPermesso}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option
                                key={`afternoon-start-${time}`}
                                value={time}
                              >
                                {time}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-orange-800 dark:text-orange-200">
                            Ora fine
                          </span>
                          <select
                            value={modalForm.afternoonEnd}
                            onChange={(e) =>
                              setModalForm((f) => ({
                                ...f,
                                afternoonEnd: e.target.value,
                              }))
                            }
                            disabled={modalForm.isAfternoonPermesso}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={`afternoon-end-${time}`} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {!modalForm.isAfternoonPermesso && (
                        <p className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-medium text-orange-700 dark:text-orange-300">
                            Durata:
                          </span>
                          <span className="font-bold text-orange-900 dark:text-orange-100">
                            {calculatedHours.afternoon.toFixed(2)} ore
                          </span>
                        </p>
                      )}
                      {modalForm.isAfternoonPermesso && (
                        <p className="mt-2 text-xs text-orange-700 dark:text-orange-300">
                          Queste ore saranno conteggiate come permesso.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {modalForm.dayType === "ferie" && (
                  <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                        Ferie
                      </h3>
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      Giornata di ferie completa - 8 ore di ferie.
                    </p>
                  </div>
                )}

                {modalForm.dayType === "malattia" && (
                  <div className="rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      <h3 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                        Malattia
                      </h3>
                    </div>
                    <p className="text-sm text-rose-800 dark:text-rose-200">
                      Giornata di malattia - 8 ore di malattia.
                    </p>
                  </div>
                )}

                {modalForm.dayType === "normal" && (
                  <>
                    {/* Summary */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">
                            Ore totali:
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            {calculatedHours.totalWorked.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border pt-2">
                          <span className="font-medium text-muted-foreground">
                            Ore regolari:
                          </span>
                          <span className="font-bold text-foreground">
                            {calculatedHours.regular.toFixed(2)}
                          </span>
                        </div>
                        {calculatedHours.overtime > 0 && (
                          <div className="flex justify-between items-center border-t border-orange-100 dark:border-orange-900/20 pt-2">
                            <span className="font-medium text-orange-700 dark:text-orange-300">
                              Straordinario:
                            </span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">
                              {calculatedHours.overtime.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {calculatedHours.permesso > 0 && (
                          <div className="flex justify-between items-center border-t border-yellow-100 dark:border-yellow-900/20 pt-2">
                            <span className="font-medium text-yellow-700 dark:text-yellow-300">
                              Permesso:
                            </span>
                            <span className="font-bold text-yellow-600 dark:text-yellow-400">
                              {calculatedHours.permesso.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Note (opzionali)
                  </span>
                  <textarea
                    value={modalForm.notes}
                    onChange={(e) =>
                      setModalForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="Aggiungi note sul tuo lavoro..."
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </label>

                {modalError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <p className="text-sm font-medium text-destructive">
                        {modalError}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 border-t border-border bg-muted/50 px-6 py-4 pt-6 rounded-b-xl flex-shrink-0">
                {/* Show delete button only if entry exists */}
                {selectedDate &&
                  entries.find((e) => e.workDate === selectedDate) && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-destructive bg-background hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2 text-destructive"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Elimina"
                      )}
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 flex-1"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    (modalForm.dayType === "normal" &&
                      calculatedHours.totalWorked === 0 &&
                      calculatedHours.permesso === 0)
                  }
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1 shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : modalForm.dayType === "ferie" ? (
                    "Salva Ferie"
                  ) : modalForm.dayType === "malattia" ? (
                    "Salva Malattia"
                  ) : (
                    "Salva"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[8rem] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              // Set selectedDate for delete
              setSelectedDate(contextMenu.date);
              handleFerie(contextMenu.date);
            }}
            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            Ferie
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              setSelectedDate(contextMenu.date);
              handleMalattia(contextMenu.date);
            }}
            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            Malattia
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              const date = contextMenu.date;
              const entry = entries.find((e) => e.workDate === date);
              if (!entry) return;
              if (
                !confirm("Sei sicuro di voler eliminare questo inserimento?")
              )
                return;
              fetch(`/api/hours?id=${entry.id}`, { method: "DELETE" })
                .then((response) => {
                  if (response.ok) {
                    setEntries((current) =>
                      current.filter((e) => e.id !== entry.id)
                    );
                    setTimeout(() => setIsRefetching(true), 200);
                  } else {
                    alert("Errore nell'eliminazione");
                  }
                })
                .catch(() => alert("Errore nell'eliminazione"));
            }}
            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-destructive/10 hover:text-destructive text-destructive data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            Elimina
          </button>
        </div>
      )}

      <RequestLeaveModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}
