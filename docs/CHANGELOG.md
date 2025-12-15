# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased - Dev Branch]

### 🎯 Major Features

#### Email System Integration
- **NEW**: Complete email functionality with nodemailer integration
  - Welcome emails for new users with temporary credentials
  - Password reset flow with secure token-based links
  - HTML templates with professional styling
  - Support for Gmail SMTP (configurable)
  - Email verification system
- **NEW**: Password reset endpoints:
  - `POST /api/auth/forgot-password` - Request password reset
  - `POST /api/auth/reset-password` - Complete password reset with token
  - `app/reset-password/page.tsx` - User-facing reset password page
- **NEW**: Documentation files:
  - `EMAIL_SETUP.md` - Complete email configuration guide
  - `GITHUB_SECRETS_EMAIL.md` - GitHub Actions secrets setup

#### User Management Enhancement
- **NEW**: Dual user management system:
  - `dashboard/users` - Production user management with email integration
  - `dashboard/users-dev` - Development mode (no email requirements)
- **NEW**: Create user endpoints:
  - `/api/users/create` - Production mode (sends welcome email)
  - `/api/users/create-dev` - Development mode (no email)
- **NEW**: Reset password endpoints:
  - `/api/users/[id]/reset-password` - Production (sends email)
  - `/api/users/[id]/reset-password-dev` - Development (returns password)
- **NEW**: Complete user management UI:
  - `components/dashboard/manage-users.tsx` - Production interface
  - `components/dashboard/manage-users-dev.tsx` - Development interface
  - Create, edit, delete, and reset password functionalities
  - Role-based user filtering and search
  - Responsive table design with mobile support

#### Session & Security Management
- **NEW**: Automatic inactivity timeout (30 minutes)
  - `hooks/use-activity-tracker.ts` - Custom React hook for activity tracking
  - `components/activity-tracker.tsx` - Global activity tracker component
  - Tracks mouse, keyboard, scroll, and touch events
  - Automatic session extension for active users
  - Alert and redirect on session expiration

#### Code Refactoring & UI Improvements
- **RENAME**: Renamed dashboard components for clarity:
  - `calendar.tsx` → `timesheet-calendar.tsx`
  - `admin-calendar.tsx` → `admin-timesheet.tsx`
  - `export-data.tsx` → `admin-reports.tsx`
  - `employee-reports.tsx` → `user-reports.tsx`
- **NEW**: Created reusable `StatsCard` component (`components/dashboard/stats-card.tsx`)
- **UPDATE**: Refactored `admin-overview.tsx` and `admin-timesheet.tsx` to use `StatsCard` (DRY principle)
- **UPDATE**: Set `logo40.svg` as the application favicon in `app/layout.tsx`
- **UPDATE**: Modified `logo40.svg` to remove white background (transparent)

---

# [0.6.0](https://github.com/matte1240/employee-app/compare/v0.5.0...v0.6.0) (2025-11-18)


### Features

* add DEV mode for user management with manual password setting and reset functionality ([e957a3a](https://github.com/matte1240/employee-app/commit/e957a3a38e41e2f90e58a36f9762acff286912e9))

# [0.5.0](https://github.com/matte1240/employee-app/compare/v0.4.0...v0.5.0) (2025-11-17)


### Features

* add sickness hours tracking to time entries and update related logic ([a75f50c](https://github.com/matte1240/employee-app/commit/a75f50c964b8370e18c960b34944c7cbda459843))
* add vacation hours tracking across dashboard components ([c970d3c](https://github.com/matte1240/employee-app/commit/c970d3c7cb8ce4bb675d825ebfbfc0e8cf7f0be5))
* refactor admin dashboard to use AdminOverview component and add leaderboard functionality ([7de5753](https://github.com/matte1240/employee-app/commit/7de5753bb2f4329ffb948bbb9ca655517b818e98))
* remove top stats cards and update related text to Italian ([6676639](https://github.com/matte1240/employee-app/commit/667663950e990695a6bba62579577879953773fe))
* update dashboard layout to include an additional column for stats cards ([6dfa79d](https://github.com/matte1240/employee-app/commit/6dfa79d7bd3ec99dde653dbcf8548e60707d182e))
* update time tracking to consolidate vacation and permission hours, and enhance dashboard statistics ([976baf8](https://github.com/matte1240/employee-app/commit/976baf88488ca3eeba9d6e5641b98fe517619bfd))

# [0.4.0](https://github.com/matte1240/employee-app/compare/v0.3.0...v0.4.0) (2025-11-17)


### Bug Fixes

* add missing volume mapping for application backups in staging configuration ([b59bcb9](https://github.com/matte1240/employee-app/commit/b59bcb93f9f2ca1bf1c50d541d63ab06f93d9caa))
* correct PostgreSQL volume path in staging configuration and add backup volume ([d487fb9](https://github.com/matte1240/employee-app/commit/d487fb93310c3e1acd2a9cbc4c54bab7690bbec7))
* downgrade PostgreSQL image from 17 to 16 and update volume paths in Docker configurations ([fa883d6](https://github.com/matte1240/employee-app/commit/fa883d6d578d2e8f3937df9c73faa8855dedc6ad))
* update database backup script to use correct service name in Docker commands ([5de228b](https://github.com/matte1240/employee-app/commit/5de228b02aa1c0e09cef922fcd7a295d1e2ffa43))
* update deployment process to stop old containers before starting new ones ([caa7937](https://github.com/matte1240/employee-app/commit/caa79376960accf7eaaca64df045637019312756))
* update git command in staging workflow to use pull instead of reset for better handling of changes ([189bab3](https://github.com/matte1240/employee-app/commit/189bab322c1a6915d9660942f9953fd62e045872))
* update PostgreSQL volume path in staging configuration ([429432a](https://github.com/matte1240/employee-app/commit/429432a9974debd0b853a5cb405cb20716c44373))


### Features

* add medical certificate field to time entries and update related logic ([c733015](https://github.com/matte1240/employee-app/commit/c733015bbc6b3c299385526c2eed639752dcca74))

## [0.3.1](https://github.com/matte1240/employee-app/compare/v0.3.0...v0.3.1) (2025-11-16)


### Bug Fixes

* add missing volume mapping for application backups in staging configuration ([b59bcb9](https://github.com/matte1240/employee-app/commit/b59bcb93f9f2ca1bf1c50d541d63ab06f93d9caa))
* correct PostgreSQL volume path in staging configuration and add backup volume ([d487fb9](https://github.com/matte1240/employee-app/commit/d487fb93310c3e1acd2a9cbc4c54bab7690bbec7))
* downgrade PostgreSQL image from 17 to 16 and update volume paths in Docker configurations ([fa883d6](https://github.com/matte1240/employee-app/commit/fa883d6d578d2e8f3937df9c73faa8855dedc6ad))
* update database backup script to use correct service name in Docker commands ([5de228b](https://github.com/matte1240/employee-app/commit/5de228b02aa1c0e09cef922fcd7a295d1e2ffa43))
* update deployment process to stop old containers before starting new ones ([caa7937](https://github.com/matte1240/employee-app/commit/caa79376960accf7eaaca64df045637019312756))
* update git command in staging workflow to use pull instead of reset for better handling of changes ([189bab3](https://github.com/matte1240/employee-app/commit/189bab322c1a6915d9660942f9953fd62e045872))
* update PostgreSQL volume path in staging configuration ([429432a](https://github.com/matte1240/employee-app/commit/429432a9974debd0b853a5cb405cb20716c44373))
