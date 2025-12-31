# Technical Architecture Document

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | TSSR Monitor - Technical Architecture |
| **Version** | 2.0 |
| **Last Updated** | December 2025 |
| **Author** | Nokia TSSR Team |
| **Status** | Active |

---

## 1. System Overview

### 1.1 Purpose

TSSR Monitor is a hybrid desktop-server application designed to manage Technical Site Survey Reports for Zain Jordan's telecommunications infrastructure. The system processes data from Excel files containing 17 worksheets and 68 columns, managing 3,791 sites across Jordan.

### 1.2 Scope

The application serves multiple stakeholders including Nokia engineers, Zain management, contractors, and internal teams across TI, RF Planning, RF Optimization, Civil, and MW departments.

---

## 2. Architecture Design

### 2.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend (Vite)                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │  │
│  │  │  Admin   │ │Management│ │Contractor│ │  Nokia Engineer  │ │  │
│  │  │Dashboard │ │Dashboard │ │Dashboard │ │    Dashboard     │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ IPC Communication
                                   ▼
┌────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                             │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Electron Main Process                        │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐  │  │
│  │  │   Excel    │ │  Firebase  │ │  Settings  │ │   File    │  │  │
│  │  │  Handlers  │ │  Handlers  │ │  Handlers  │ │  Monitor  │  │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └───────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
┌──────────────────────┐ ┌─────────────┐ ┌──────────────────────────┐
│     DATA LAYER       │ │ CLOUD LAYER │ │    EXTERNAL ACCESS       │
├──────────────────────┤ ├─────────────┤ ├──────────────────────────┤
│  ┌────────────────┐  │ │  Firebase   │ │  Static IP Gateway       │
│  │  Excel File    │  │ │  Firestore  │ │  (Up to 10 users)        │
│  │  (.xlsm)       │  │ │             │ │                          │
│  │  17 Worksheets │  │ │  Real-time  │ │                          │
│  │  68 Columns    │  │ │  Sync       │ │                          │
│  └────────────────┘  │ │             │ │                          │
└──────────────────────┘ └─────────────┘ └──────────────────────────┘
```

### 2.2 Component Architecture

#### 2.2.1 Frontend Components

```
src/renderer/
├── components/
│   ├── common/
│   │   ├── Header.jsx           # Navigation header with branding
│   │   ├── Sidebar.jsx          # Role-based navigation menu
│   │   ├── LoadingSpinner.jsx   # Loading state indicator
│   │   └── ErrorBoundary.jsx    # Error handling wrapper
│   │
│   ├── cards/
│   │   ├── SiteCard.jsx         # Individual site display
│   │   ├── StatusCard.jsx       # Status summary cards
│   │   └── StatisticsCard.jsx   # KPI display cards
│   │
│   ├── tables/
│   │   ├── SiteTable.jsx        # Main data table
│   │   ├── ActivityLog.jsx      # Activity history table
│   │   └── PendingTasks.jsx     # Pending items table
│   │
│   └── charts/
│       ├── StatusPieChart.jsx   # Status distribution
│       ├── GovernorateBar.jsx   # Geographic distribution
│       └── TrendLine.jsx        # Progress over time
│
├── pages/
│   ├── LoginPage.jsx            # Authentication
│   ├── AdminDashboard.jsx       # Admin-specific view
│   ├── ManagementDashboard.jsx  # Management view
│   ├── ContractorDashboard.jsx  # Contractor view
│   └── NokiaDashboard.jsx       # Nokia engineer view
│
└── hooks/
    ├── useFirebase.js           # Firebase operations
    ├── useExcelData.js          # Excel data access
    └── useAuth.js               # Authentication state
```

#### 2.2.2 Backend Components

```
src/main/
├── main.js                      # Entry point (214 lines)
│
├── ipc/
│   ├── excelHandlers.js         # Excel file operations
│   ├── firebaseHandlers.js      # Firebase sync operations
│   ├── settingsHandlers.js      # App configuration
│   └── authHandlers.js          # Authentication
│
├── utils/
│   ├── excelReader.js           # XLSX library wrapper
│   ├── firebaseAdmin.js         # Firebase Admin SDK
│   ├── fileWatcher.js           # Chokidar file monitoring
│   └── logger.js                # Activity logging
│
└── services/
    ├── syncService.js           # Data synchronization
    └── exportService.js         # Report generation
```

---

## 3. Data Architecture

### 3.1 Excel Data Structure

#### 3.1.1 Master Sheet Schema (68 Columns)

| Category | Columns | Description |
|----------|---------|-------------|
| **Site Info** | Site ID, Final Site Name, Site Code, Site Type, Key Number | Basic site identification |
| **Location** | Longitude, Latitude, Governorate | Geographic data |
| **Structure** | Structure Type, Height (m), Part of | Physical structure |
| **Ownership** | Site Owner, Owner Name, Owner Contact | Ownership details |
| **Project** | Phase Name, Priority, Cluster, Area, Weekly Plan | Project management |
| **Technical** | TSS SMP, TSSR Subcon, NEW Allocation, TSSR PO# | Technical specs |
| **5G Info** | 5G Sectors Names, 5G Solution, Site Sectors #, IBS Sector, TDD Site | 5G configuration |
| **Nokia Status** | Nokia NPO Status, Nokia NPO Comment, Nokia Site Owner | Nokia workflow |
| **TI Status** | TI Status, TI Comment, Cluster Owner (TI) | Technical Integration |
| **RF Planning** | RF Plan Status, RF Plan Comment, Cluster Owner (Planning) | RF Planning dept |
| **RF Optimization** | RF Optim Status, RF Opt. Comment, Cluster Owner (Optimization) | RF Optimization |
| **Civil** | Civil Status, Civil Comment, Cluster Owner (Civil) | Civil engineering |
| **Microwave** | MW Status, Cluster Owner (MW) | Microwave dept |
| **TSSR Status** | TSSR Overall Status, TSSR Status Date, TSSR Remark, Action Age | Overall tracking |
| **Other** | RFI Status, Gap Analysis, Approved, TSSR Ready, Dismantle Status | Additional flags |

#### 3.1.2 All Worksheets

| # | Sheet Name | Purpose | Dimensions |
|---|------------|---------|------------|
| 1 | Master Sheet | Primary database | A1:BP3794 |
| 2 | Dashboard | Visual KPIs | B1:Z43 |
| 3 | TSSR Status Tracker | Status changes | A1:AI4102 |
| 4 | Pending Sheet | Awaiting action | A1:AI1000 |
| 5 | Customer Report | Stakeholder reports | A1:X387 |
| 6 | Weekly Plan | Task planning | A1:U88 |
| 7 | Nokia Report | Nokia reporting | A1:BF799 |
| 8 | Rejection Sheet | Rejected TSSRs | A1:R985 |
| 9 | Source Sheet | Source data | A1:AH1585 |
| 10 | ActivityLog | System logging | A1:B2822 |
| 11 | TSSR Status Trigger | Automation | A1:S5532 |
| 12-17 | Sheet1-5, PreviousValues | Working/Temp | Various |

### 3.2 Firebase Data Structure

```javascript
// Firestore Collections

/sites/{siteId}
{
  siteId: "ZJ-001",
  siteName: "Amman Central",
  siteCode: "AMM-C-001",
  location: {
    latitude: 31.9454,
    longitude: 35.9284,
    governorate: "Amman"
  },
  status: {
    tssr: "Approved",
    ti: "Approved",
    rfPlan: "Approved",
    rfOptim: "Pending",
    civil: "Approved",
    mw: "N/A"
  },
  ownership: {
    owner: "TASC",
    ownerName: "...",
    contact: "..."
  },
  project: {
    phase: "RO4",
    priority: 1,
    cluster: "Cluster-1"
  },
  timestamps: {
    created: Timestamp,
    lastModified: Timestamp,
    lastSyncedFromExcel: Timestamp
  }
}

/activityLog/{logId}
{
  action: "STATUS_CHANGE",
  siteId: "ZJ-001",
  previousValue: "Pending",
  newValue: "Approved",
  department: "TI",
  userId: "user123",
  timestamp: Timestamp
}

/users/{userId}
{
  email: "user@nokia.com",
  role: "nokia_engineer",
  department: "NPO",
  permissions: ["read", "update_status"],
  lastLogin: Timestamp
}
```

---

## 4. Technology Stack

### 4.1 Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Desktop Framework** | Electron | 28.0 | Cross-platform desktop app |
| **Frontend** | React | 18.2 | UI components |
| **Build Tool** | Vite | 5.0 | Fast development build |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS |
| **Backend** | Node.js | 18 LTS | Server runtime |
| **Database (Cloud)** | Firebase Firestore | Latest | Real-time sync |
| **Excel Processing** | XLSX (SheetJS) | 0.18 | Excel file handling |
| **File Monitoring** | Chokidar | 3.6.0 | File change detection |

### 4.2 Development Tools

| Tool | Purpose |
|------|---------|
| VS Code | Primary IDE |
| ESLint | Code linting |
| Prettier | Code formatting |
| Git | Version control |
| PowerShell | Build scripts |

---

## 5. Security Architecture

### 5.1 Authentication Flow

```
┌──────────┐    ┌───────────┐    ┌──────────────┐
│  User    │───►│  Login    │───►│   Firebase   │
│  Input   │    │  Page     │    │   Auth       │
└──────────┘    └───────────┘    └──────┬───────┘
                                        │
                                        ▼
                               ┌──────────────┐
                               │  JWT Token   │
                               │  Generation  │
                               └──────┬───────┘
                                      │
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
              ┌───────────┐   ┌───────────┐   ┌───────────┐
              │   Admin   │   │  Manager  │   │ Engineer  │
              │   Access  │   │  Access   │   │  Access   │
              └───────────┘   └───────────┘   └───────────┘
```

### 5.2 Role-Based Access Control (RBAC)

| Permission | Admin | Management | Contractor | Nokia Engineer |
|------------|:-----:|:----------:|:----------:|:--------------:|
| View All Sites | ✅ | ✅ | ❌ | ✅ |
| Edit Site Data | ✅ | ❌ | ✅ | ✅ |
| Approve TSSR | ✅ | ✅ | ❌ | ✅ |
| Generate Reports | ✅ | ✅ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ✅ |

---

## 6. Synchronization Architecture

### 6.1 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC WORKFLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌────────────┐     ┌────────────┐     ┌────────────────┐  │
│   │   Excel    │────►│   File     │────►│   Parse &      │  │
│   │   File     │     │   Watcher  │     │   Validate     │  │
│   │   (.xlsm)  │     │ (Chokidar) │     │   Data         │  │
│   └────────────┘     └────────────┘     └───────┬────────┘  │
│                                                  │           │
│                                                  ▼           │
│   ┌────────────┐     ┌────────────┐     ┌────────────────┐  │
│   │   React    │◄────│   IPC      │◄────│   Transform    │  │
│   │   State    │     │   Bridge   │     │   to JSON      │  │
│   └────────────┘     └────────────┘     └───────┬────────┘  │
│                                                  │           │
│                                                  ▼           │
│                                         ┌────────────────┐  │
│                                         │   Firebase     │  │
│                                         │   Firestore    │  │
│                                         │   (Batch)      │  │
│                                         └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Sync Configuration

```javascript
// Sync Settings
const SYNC_CONFIG = {
  INTERVAL: 5 * 60 * 1000,    // 5 minutes
  BATCH_SIZE: 500,             // Firebase batch limit
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  FILE_WATCH_DEBOUNCE: 2000    // 2 seconds
};
```

---

## 7. Performance Considerations

### 7.1 Optimization Strategies

| Area | Strategy | Implementation |
|------|----------|----------------|
| **Excel Reading** | Lazy loading | Read only required sheets |
| **Firebase Writes** | Batch operations | 500 docs per batch |
| **UI Rendering** | Virtual scrolling | For large tables |
| **Memory** | Data pagination | 100 records per page |
| **Caching** | Local cache | IndexedDB for offline |

### 7.2 Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Firebase Spark Plan | 20K writes/day | Monitor quota, upgrade to Blaze |
| Excel Auto Filters | Partial data read | Disable filters before sync |
| Large File Processing | Memory usage | Stream processing |

---

## 8. Error Handling

### 8.1 Error Categories

```javascript
// Error Types
const ERROR_TYPES = {
  EXCEL_READ_ERROR: 'ERR_EXCEL_001',
  FIREBASE_WRITE_ERROR: 'ERR_FB_001',
  FIREBASE_QUOTA_ERROR: 'ERR_FB_002',
  AUTH_ERROR: 'ERR_AUTH_001',
  NETWORK_ERROR: 'ERR_NET_001',
  VALIDATION_ERROR: 'ERR_VAL_001'
};
```

### 8.2 Recovery Procedures

| Error | Recovery Action |
|-------|-----------------|
| Excel file locked | Retry after delay, notify user |
| Firebase quota exceeded | Queue writes, notify admin |
| Network disconnection | Enable offline mode |
| Invalid data format | Log error, skip record |

---

## 9. Deployment Architecture

### 9.1 Local Deployment

```
┌─────────────────────────────────────────────┐
│             Local Infrastructure            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐    ┌─────────────────────┐ │
│  │   Desktop   │    │   Excel File        │ │
│  │   App       │◄──►│   (Network Share)   │ │
│  │   (.exe)    │    │                     │ │
│  └──────┬──────┘    └─────────────────────┘ │
│         │                                    │
│         │ Static IP                          │
│         ▼                                    │
│  ┌─────────────────────────────────────────┐ │
│  │         External Users (10 max)          │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

*Document Version: 2.0 | Last Updated: December 2025*
