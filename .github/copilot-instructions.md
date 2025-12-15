# Copilot Instructions for Employee Work Hours Tracker

## Project Overview
This is a **Next.js 16 + Prisma + NextAuth + PostgreSQL** time tracking application. Employees log work hours via an interactive calendar; admins review team-wide data, manage users, and configure system settings.

## Architecture & Data Flow

### Core Stack
- **Frontend**: Next.js 16 App Router, React 19, Server Components, Tailwind CSS v4
- **Auth**: NextAuth v4 with JWT sessions, Credentials provider, Prisma adapter
- **Database**: PostgreSQL with Prisma ORM v6 (migrations in `prisma/migrations/`)
- **Validation**: Zod for runtime schema validation on API routes
- **Deployment**: Docker Compose for containerized environments (dev & prod)
- **Utilities**: `date-holidays` for holiday management, `exceljs` for reports, `nodemailer` for emails

### Key Components
- **`lib/auth.ts`**: NextAuth configuration, JWT callbacks, `tokenVersion` logic for session invalidation
- **`lib/prisma.ts`**: Global Prisma client singleton
- **`types/next-auth.d.ts`**: TypeScript augmentation for Session, User, JWT with `role` and `id`
- **`app/api/auth/[...nextauth]/route.ts`**: NextAuth handler
- **`prisma/schema.prisma`**: Data models (`User`, `TimeEntry`, `Account`, `Session`, `VerificationToken`)

### Data Model Patterns
- **User**: Role-based (`EMPLOYEE`, `ADMIN`); `tokenVersion` for security; `passwordHash` for credentials
- **TimeEntry**: 
  - Fields: `workDate`, `hoursWorked`, `overtimeHours`, `permessoHours`, `sicknessHours`, `vacationHours`
  - Shifts: `morningStart`, `morningEnd`, `afternoonStart`, `afternoonEnd`
  - Metadata: `notes`, `medicalCertificate`
  - Relations: Linked to `User` (Cascade delete)
  - Index: `(userId, workDate)` for fast lookups

## Common Workflows

### Adding a New API Endpoint
1. Create handler in `app/api/{resource}/route.ts`
2. Call `getAuthSession()` at the top; return 401 if missing
3. Check `session.user.role` for ADMIN-only endpoints (use `isAdmin(session)`)
4. Use **Zod schema** for request validation
5. Convert Prisma `Decimal` types to JSON-safe numbers using `parseFloat()` or helper functions
6. Return `NextResponse.json(data, { status: ... })`

### Server Component Data Fetching
- Use `getAuthSession()` for auth checks
- Query Prisma directly for initial page data
- Convert Prisma types to **DTOs** (e.g., `TimeEntryDTO`) before passing to client components
- Use `toPlainEntry` or similar helpers to serialize dates and decimals

### Client Component Patterns
- Mark interactive components with `"use client"`
- Use `TimesheetCalendar` for calendar interactions
- Use `useTransition()` for mutations to keep UI responsive
- Handle 401 errors by redirecting to login
- Store DTOs in state, not raw Prisma objects

## Critical Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run prisma:migrate` | Create/apply dev migrations |
| `npm run prisma:deploy` | Apply migrations in production |
| `npm run prisma:seed` | Populate test data |
| `npm run docker:dev` | Start dev environment with Docker |
| `npm run docker:dev:build` | Rebuild and start dev environment |

## Project Conventions

### Role-Based Access Control (RBAC)
- **EMPLOYEE**: 
  - View/edit own `TimeEntry` records
  - Restricted to current month (and past dates in current month)
  - Cannot log hours for future dates or holidays (unless configured)
  - Entry types: Normal work, Ferie (Vacation), Malattia (Sickness), Permesso (Leave)
- **ADMIN**: 
  - Query any user's data (`userId` param)
  - Manage users (create, edit, delete)
  - Manage holidays and system settings
  - View global reports and stats

### File Organization
```
app/
  ├── api/
  │   ├── auth/              # NextAuth & Password reset
  │   ├── admin/             # Admin stats & management
  │   ├── hours/             # TimeEntry CRUD
  │   └── users/             # User management
  ├── dashboard/
  │   ├── admin/             # Admin-specific pages
  │   ├── calendar/          # Employee calendar view
  │   └── reports/           # Reporting views
  └── layout.tsx             # Root layout
components/
  ├── dashboard/
  │   ├── timesheet-calendar.tsx # Main calendar component
  │   ├── stats-card.tsx         # Dashboard statistics
  │   └── admin-*.tsx            # Admin components
  └── features/                  # Feature-specific components
lib/
  ├── utils/                 # Helper functions (date, time, calc)
  └── auth.ts                # Auth logic
prisma/
  └── schema.prisma          # Database schema
```

### Development Tips
- **Decimal Handling**: Always convert Prisma `Decimal` to `number` for the frontend.
- **Date Handling**: Use `date-fns` for date manipulation. Store dates as `DateTime` in DB, but handle timezones carefully (usually UTC).
- **Validation**: Keep Zod schemas in sync with Prisma models.
- **Icons**: Use `lucide-react` for UI icons.
