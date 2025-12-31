# e-YAS SITES - Site Intelligence Tracking & Execution System

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20|%20macOS%20|%20Linux-lightgrey)
![Electron](https://img.shields.io/badge/Electron-28.0-47848F)
![React](https://img.shields.io/badge/React-18.0-61DAFB)

## Overview

e-YAS SITES is a comprehensive desktop application for tracking Technical Site Survey Reports (TSSR) for telecommunications infrastructure. Built with Electron + React + Express.

### Key Features

- **Real-time Site Tracking**: Monitor telecommunication sites across Jordan
- **Multi-Department Workflow**: TI, RF Planning, RF Optimization, Civil, MW, Nokia NPO
- **Role-Based Access Control**: Admin, Management, Contractor, Nokia Engineer
- **Excel Integration**: Import from .xlsm files (68 columns)
- **Dual Database**: SQLite (offline) + Supabase (cloud)
- **Real-time Collaboration**: WebSocket live updates

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron 28 |
| Frontend | React 18 + Vite 5 |
| Backend | Express 5 + Node.js |
| Database | SQLite (better-sqlite3) / Supabase |
| Real-time | WebSocket (ws) |
| Auth | JWT + bcrypt |
| Charts | Recharts + Chart.js |
| Grid | AG Grid Community |
| Maps | Leaflet + React-Leaflet |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run full application (Vite + Express + Electron)
npm run dev:full

# Or use the batch file
RUN.bat
```

**Default Login:** `admin` / `admin123`

---

## Project Structure

```
tssr-app/
├── electron/                    # Backend (Node.js)
│   ├── server/
│   │   ├── apiServer.js         # Express server entry
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.js          # Authentication
│   │   │   ├── sites.js         # Sites CRUD
│   │   │   ├── stats.js         # Statistics
│   │   │   ├── users.js         # User management
│   │   │   ├── contractors.js   # Contractors
│   │   │   ├── nokiaReviews.js  # Nokia/Ghirbal
│   │   │   ├── auditLogs.js     # Activity logging
│   │   │   └── backup.js        # Backups
│   │   ├── middleware/          # Auth middleware
│   │   ├── utils/               # Validation, rate limiting
│   │   └── websocket.js         # WebSocket server
│   ├── database/
│   │   ├── db.js                # Database manager
│   │   ├── adapters/            # SQLite/Supabase adapters
│   │   ├── migrations/          # SQL migrations
│   │   └── queries/             # Database queries
│   ├── services/
│   │   ├── excelReader.js       # Excel import
│   │   ├── realtimeSync.js      # Real-time sync
│   │   └── batchProcessor.js    # Batch processing
│   ├── ipc/                     # IPC handlers (20+ modules)
│   ├── standaloneServer.js      # Standalone server
│   ├── main.js                  # Electron main
│   └── preload.js               # Preload script
│
├── src/                         # Frontend (React)
│   ├── pages/
│   │   ├── Admin/               # Admin pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Sites.jsx
│   │   │   ├── Settings/
│   │   │   ├── Reports/
│   │   │   ├── SpreadsheetView/
│   │   │   └── Map/
│   │   ├── Management/          # Management pages
│   │   ├── Contractor/          # Contractor pages
│   │   └── Nokia/               # Nokia pages
│   ├── components/
│   │   ├── Layout/              # Sidebar, header
│   │   ├── Sites/               # Site cards
│   │   ├── Import/              # Excel import
│   │   └── EditSiteModal/       # Site editing
│   ├── context/
│   │   ├── AuthContext.jsx      # Auth state
│   │   └── DataContext.jsx      # Data management
│   └── utils/
│       └── calculations/        # Business logic
│
├── data/
│   └── tssr.db                  # SQLite database
│
└── tests/                       # Test files
```

---

## Server Ports

| Port | Service |
|------|---------|
| 3000 | Vite Dev Server |
| 3001 | Express API Server |
| 3002 | WebSocket Server |

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full access + Settings |
| `management` | Dashboard, Sites, Reports |
| `contractor` | Own sites only |
| `nokia_engineer` | Nokia/Ghirbal features |

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | Login (username, password) |
| `/api/auth/login` | POST | Alternative login |
| `/api/auth/verify` | GET | Verify JWT token |

### Sites

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites` | GET | Get all sites |
| `/api/sites/:siteId` | GET | Get single site |
| `/api/sites/:siteId` | PUT | Update site |
| `/api/phases` | GET | Get phases list |

### Statistics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Full statistics |
| `/api/stats/breakdown` | GET | Stats by Part Of |
| `/api/stats/overview` | GET | Pivot table |

### Users (Admin Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | List users |
| `/api/users` | POST | Create user |
| `/api/users/:id` | DELETE | Delete user |

### Contractors

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contractors` | GET | List contractors |
| `/api/contractors` | POST | Create contractor |
| `/api/contractors/:id` | PUT | Update contractor |
| `/api/contractors/:id` | DELETE | Delete contractor |

### Nokia/Ghirbal

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nokia-reviews` | GET | Get reviews |
| `/api/nokia-reviews` | POST | Create/update review |
| `/api/ghirbal-sites` | GET | Ghirbal sites |
| `/api/checked-sites` | GET | Checked sites |

### Other

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/settings` | GET | Get settings |
| `/api/audit-logs` | GET | Activity logs |
| `/api/backups` | GET | List backups |

---

## Database Schema

### Main Tables

| Table | Description | Columns |
|-------|-------------|---------|
| `sites` | Main sites | 71 |
| `sites_cache` | Working cache | Dynamic |
| `users` | User accounts | 6 |
| `settings` | App settings | 5 |
| `activity_log` | Audit trail | 5 |
| `comments` | Site comments | 6 |
| `sync_log` | Sync history | 6 |

### Sites Table Key Fields

```sql
-- Identification
site_id, final_site_name, site_code, site_type

-- Location
longitude, latitude, governorate, height_m

-- Classification
phase_name, part_of, priority, cluster, area

-- Department Statuses
ti_status, ti_comment
rf_plan_status, rf_plan_comment
rf_opt_status, rf_opt_comment
civil_status, civil_comment
mw_status, mw_comment
nokia_npo_status, nokia_npo_comment

-- Overall
tssr_overall_status, tssr_status_date
tssr_subcon, action_age, version, tssr_ready

-- Timestamps
created_at, updated_at
```

---

## Business Logic

### Departments (Workflow Order)

1. **TI** - Technical Integration
2. **RF Planning** - RF Planning
3. **RF Optimization** - RF Optimization
4. **Civil** - Civil works
5. **Microwave** - MW department
6. **Nokia NPO** - Nokia Network Planning

### Status Values

- `Approved` - Approved
- `Pending` - Under review
- `Rejected` - Rejected
- `Released` - Released
- `N/A` - Not applicable

### Overall Status Logic

```
If ALL departments Approved/N/A → "Approved"
If ANY department Rejected → "TSSR Under [Dept] validation"
If ANY department Pending → "TSSR Under ROM Review"
```

### Action Age

Days elapsed since `tssr_status_date`.

---

## Authentication System

- **JWT Tokens**: 24-hour expiry
- **bcrypt**: 10 rounds password hashing
- **Rate Limiting**: 5 attempts per 15 minutes
- Auto-upgrade plaintext passwords to bcrypt

---

## Frontend Routes

### Admin (`/admin/*`)
```
/admin                  Dashboard
/admin/sites            Sites management
/admin/contractors      Contractors
/admin/reports          Reports
/admin/map              Map view
/admin/spreadsheet      Spreadsheet view
/admin/settings         Settings
/admin/import           Data import
/admin/backups          Backups
/admin/ghirbal          Ghirbal review
/admin/change-requests  Change requests
```

### Management (`/management/*`)
Same as Admin except `/settings`

### Contractor (`/contractor/*`)
```
/contractor             Dashboard
/contractor/sites       Own sites
/contractor/map         Map view
/contractor/rejections  View rejections
```

### Nokia (`/nokia/*`)
```
/nokia                  Dashboard
/nokia/sites            Sites view
/nokia/reports          Reports
/nokia/ghirbal          Ghirbal review
/nokia/clear-tssr       Clear TSSR
```

---

## NPM Scripts

```bash
# Development
npm run dev              # Vite only
npm run dev:full         # Vite + Server + Electron
npm run server           # Standalone server

# Build
npm run build            # Build frontend
npm run package          # Package Electron app

# Testing
npm run test             # All tests
npm run test:unit        # Unit tests
npm run test:integration # Integration tests

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database

# Cleanup
npm run clean            # Clean build
npm run clean:all        # Clean + node_modules
```

---

## Environment Variables

```env
# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
BCRYPT_ROUNDS=10

# Database
DATABASE_TYPE=sqlite    # or 'supabase'
SUPABASE_URL=...
SUPABASE_KEY=...
```

---

## Security

- **contextIsolation**: `true`
- **nodeIntegration**: `false`
- Input validation on all endpoints
- Parameterized SQL queries
- Rate limiting on login
- Audit logging

---

## Brand Colors

```css
--primary: #8FD9D9;     /* Turquoise */
--secondary: #FF8566;   /* Orange */
--background: #1a1a2e;  /* Dark */
--surface: #16213e;     /* Surface */
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     e-YAS SITES System                       │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────┐   ┌───────────┐   ┌────────────────────────┐ │
│  │  React    │   │ Electron  │   │   Database Layer       │ │
│  │  Frontend │◄──┤  Main     │◄──┤  ┌────────┐ ┌────────┐ │ │
│  │  (Vite)   │   │ Process   │   │  │SQLite  │ │Supabase│ │ │
│  └───────────┘   └─────┬─────┘   │  │(Local) │ │(Cloud) │ │ │
│                        │         │  └────────┘ └────────┘ │ │
│                 ┌──────▼─────┐   └────────────────────────┘ │
│                 │  Servers   │                              │
│                 │ ┌────────┐ │  Port: 3001                  │
│                 │ │REST API│ │                              │
│                 │ │Express │ │                              │
│                 │ └────────┘ │                              │
│                 │ ┌────────┐ │  Port: 3002                  │
│                 │ │WebSocket│ │                              │
│                 │ │  Server │ │                              │
│                 │ └────────┘ │                              │
│                 └────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Support

- **Author**: Aysar
- **Documentation**: `/docs` folder

---

## License

Copyright © 2025. All rights reserved.

*Last Updated: December 2025*
