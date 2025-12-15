# 🕐 Employee Work Hours Tracker

A modern, full-stack time tracking application built with **Next.js 16**, **React 19**, **Prisma**, **NextAuth**, and **PostgreSQL**. Designed for teams to track work hours, manage overtime, and generate reports with an intuitive calendar interface.

**⚠️ IMPORTANT:** This application runs exclusively in **Docker Compose** for production deployments.

---

## 🌟 Features

### For Employees
- 📅 **Interactive Calendar Interface** - Click any day to log work hours with visual feedback
- ⏰ **Shift Tracking** - Record morning and afternoon shifts separately (30-minute precision)
- 📊 **Automatic Calculations** - Regular hours (max 8h/day), overtime, and permission hours computed automatically
- 📝 **Notes & Details** - Add contextual information for each workday
- 🔒 **Personal Dashboard** - View only your own time entries
- 📈 **Activity Reports** - Track personal metrics and trends
- **Time Restrictions** - Can only log hours for current month up to today (enforced server-side)

### For Administrators
- 👥 **Team Overview** - Real-time view of all employee hours, overtime, and totals
- 📋 **User Management** - Create, edit, and manage employee accounts
- 📊 **Advanced Reports** - Filter by user, date range, export to Excel
- 📥 **Data Export** - Generate Excel reports for payroll and analytics
- 🔑 **Role-Based Access** - Full control over team data and settings
- 🔐 **Password Management** - Reset employee passwords and manage credentials

### General
- 🔐 **NextAuth v4 Security** - Credential-based authentication with bcryptjs hashing
- ⏱️ **Auto Logout** - 30-minute inactivity timeout for security
- 🎨 **Tailwind CSS v4** - Modern, responsive UI with smooth animations
- 📱 **Mobile-Friendly** - Works seamlessly on desktop, tablet, and mobile
- 📲 **Progressive Web App (PWA)** - Install on any device, works offline
- 🐳 **Docker Ready** - Complete containerization with PostgreSQL and volumes

---

## 🏗️ Architecture

### Tech Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | Next.js App Router | 16.0.3 |
| **UI Library** | React | 19.2.0 |
| **Styling** | Tailwind CSS | v4 |
| **Database** | PostgreSQL | 16 (Alpine) |
| **ORM** | Prisma | 6.19.0 |
| **Authentication** | NextAuth.js | 4.24.13 |
| **Validation** | Zod | 4.1.12 |
| **Password Hashing** | bcryptjs | 3.0.3 |
| **Reports** | ExcelJS | 4.4.0 |
| **Runtime** | Node.js | 20 (Alpine) |

### Data Model
```
User (id, email, passwordHash, role, name, image, tokenVersion, createdAt, updatedAt)
  ├── TimeEntry (workDate, hoursWorked, overtimeHours, permessoHours, shifts, notes)
  ├── Account (OAuth/NextAuth adapter)
  ├── Session (NextAuth sessions)
  └── VerificationToken (password resets)
```

### Deployment Architecture
```
┌─────────────────────────────────────────────┐
│   Docker Compose (docker-compose.yml)      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │   Next.js App    │  │   PostgreSQL   │  │
│  │  (port 3001)     │  │   (port 5433)  │  │
│  │                  │  │                │  │
│  │  - Server: Node  │  │  - Data        │  │
│  │  - API routes    │  │  - Backups     │  │
│  │  - Frontend SSR  │  │  - Volumes     │  │
│  └──────────────────┘  └────────────────┘  │
│          │                     │            │
│          └─────────────────────┘            │
│      (DATABASE_URL connection)              │
│                                             │
│  Volumes:                                   │
│  - postgres_data (DB persistence)           │
│  - ./backups (Database backups)             │
│  - ./logs (Application logs)                │
└─────────────────────────────────────────────┘
```

---

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- **[🚀 Deployment & Release Guide](docs/DEPLOYMENT.md)**: Docker setup, staging/production deployment, and release process.
- **[🤝 Contributing Guide](docs/CONTRIBUTING.md)**: Development setup, branching strategy, and how to contribute.
- **[⚙️ Configuration Guide](docs/CONFIGURATION.md)**: Email setup, environment variables, secrets, and backups.
- **[📲 PWA Guide](docs/PWA.md)**: Progressive Web App features, installation, and offline capabilities.
- **[📝 Changelog](docs/CHANGELOG.md)**: History of changes and versions.

---

## 🚀 Quick Start

For local development:

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/employee-app.git
cd employee-app
cp .env.example .env

# 2. Install and run
npm install
npm run dev
```

For full details, see the [Contributing Guide](docs/CONTRIBUTING.md).

---

## 🔐 Role-Based Access Control (RBAC)

### Employee Permissions
- ✅ View/edit own time entries only
- ✅ Log hours for current month up to today
- ✅ View personal dashboard and reports
- ❌ Access admin functions

### Admin Permissions
- ✅ View all time entries (all employees)
- ✅ Create/edit/delete user accounts
- ✅ Reset employee passwords
- ✅ Generate team reports and export data

---

## 📄 License

This project is licensed under the MIT License.
