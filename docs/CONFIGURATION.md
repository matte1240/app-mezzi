# ⚙️ Configuration Guide

This guide covers the configuration of various system components.

## 📋 Table of Contents
- [Email Setup](#email-setup)
- [GitHub Secrets](#github-secrets)
- [Inactivity Timeout](#inactivity-timeout)
- [Backup Strategy](#backup-strategy)

---

## 📧 Email Setup (Gmail)

The application uses Nodemailer with Gmail SMTP for sending emails (welcome, password reset).

### Prerequisites
- Gmail account with 2FA enabled.
- App Password generated.

### Configuration
1.  Generate an **App Password** in your Google Account (Security > 2-Step Verification > App passwords).
2.  Update `.env`:
    ```env
    EMAIL_HOST=smtp.gmail.com
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASSWORD=your-16-char-app-password
    EMAIL_FROM_NAME=Time Tracker
    ```

---

## 🔧 Environment Variables

The application is configured via `.env` file. See `.env.example` for a template.

### Key Variables
| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Database password |
| `NEXTAUTH_SECRET` | Secret for session encryption (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL of the application (e.g., `http://localhost:3000`) |
| `APP_URL` | Public URL of the application |
| `NODE_ENV` | `development` or `production` |

---

## 🔐 GitHub Secrets

For GitHub Actions (CI/CD), configure the following secrets in **Settings > Secrets and variables > Actions**:

### Email Secrets
- `EMAIL_HOST`, `EMAIL_PORT` (587), `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM_NAME`

### Deployment Secrets (Staging & Production)
- `STAGING_DATABASE_URL`, `STAGING_NEXTAUTH_SECRET`, `STAGING_NEXTAUTH_URL`, `STAGING_SSH_KEY`, `STAGING_USER`, `STAGING_IP`
- `PRODUCTION_DATABASE_URL`, `PRODUCTION_NEXTAUTH_SECRET`, `PRODUCTION_NEXTAUTH_URL`, `PRODUCTION_SSH_KEY`, `PRODUCTION_USER`, `PRODUCTION_IP`

---

## ⏱️ Inactivity Timeout

The system enforces a **30-minute inactivity timeout** for security.

### How it works
- **Client-side**: `useActivityTracker` hook monitors mouse/keyboard events. Redirects to login if inactive.
- **Server-side**: NextAuth session `maxAge` is 30 minutes. JWT checks `lastActivity` timestamp.

### Configuration
Modify `lib/auth.ts` (`session.maxAge`) and `hooks/use-activity-tracker.ts` (`THIRTY_MINUTES` constant) to change the duration.

---

## 💾 Backup Strategy

Database backups are managed via npm scripts and Docker.

### Manual Backup
```bash
npm run backup:db
```
Creates a gzipped SQL dump in `backups/database/`.

### Restore
```bash
npm run restore:db <filename>
```
**Warning**: Overwrites existing database.

### Automatic Backups
Can be scheduled via cron on the host machine:
```bash
# Daily backup at 2:00 AM
0 2 * * * cd /path/to/app && docker compose exec -T postgres pg_dump -U app employee_tracker | gzip > backups/database/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

### Retention Policy
Use `npm run backup:cleanup` to remove old backups (default: keep 30 days, min 7 backups).
