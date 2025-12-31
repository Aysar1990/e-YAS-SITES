# TSSR Monitor - Database Schema

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Database Schema & Data Dictionary |
| **Version** | 2.0 |
| **Last Updated** | December 2025 |

---

## 1. Overview

TSSR Monitor uses a hybrid data architecture combining Excel as the primary data source and Firebase Firestore for real-time collaboration and cloud storage.

### 1.1 Data Sources

| Source | Type | Purpose |
|--------|------|---------|
| **Excel (.xlsm)** | Primary | Master data storage, VBA automation |
| **Firebase Firestore** | Secondary | Real-time sync, cloud collaboration |
| **Local Storage** | Cache | Offline support, performance |

---

## 2. Excel Schema

### 2.1 Master Sheet - Complete Column Reference

#### Site Identification (Columns A-E)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| A | Site ID | String | Unique site identifier | ZJ-001 |
| B | Final Site Name | String | Official site name | Amman Central Tower |
| C | Site Code | String | Internal code | AMM-C-001 |
| D | Site Type | String | Site classification | Macro, Micro, IBS |
| E | Key Number | String | Physical key reference | KEY-12345 |

#### Location Data (Columns F-H)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| F | Longitude | Decimal | GPS longitude | 35.9284 |
| G | Latitude | Decimal | GPS latitude | 31.9454 |
| H | Governorate | String | Administrative region | Amman |

#### Structure Information (Columns I-K)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| I | Structure Type | String | Physical structure | Rooftop, Tower, Pole |
| J | Height (m) | Number | Structure height in meters | 45 |
| K | Part of | String | Parent site (if applicable) | ZJ-000 |

#### Ownership Details (Columns L-N)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| L | Site Owner | String | Ownership entity | TASC, ZAIN, ZAIN/M |
| M | Owner Name | String | Owner contact name | Ahmad Hassan |
| N | Owner Contact Number | String | Phone number | +962-7-XXXX-XXXX |

#### Project Management (Columns O-S)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| O | Phase Name | String | Project phase | RO4, Phase-2, PO3 |
| P | Priority | Number | Priority ranking | 1, 2, 3 |
| Q | Cluster | String | Geographic cluster | Cluster-1 |
| R | Area | String | Coverage area | Downtown |
| S | Weekly Plan | String | Weekly assignment | Week-51 |

#### Technical Details (Columns T-W)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| T | TSS SMP | String | TSS SMP reference | SMP-12345 |
| U | TSSR Subcon | String | Subcontractor name | Al-Lewan, SMART |
| V | NEW Allocation | String | New allocation status | Yes, No |
| W | TSSR PO# | String | Purchase order number | PO-2025-001 |

#### 5G Configuration (Columns X-AB)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| X | 5G Sectors Names | String | Sector identifiers | S1, S2, S3 |
| Y | 5G Solution | String | 5G technology type | NSA, SA |
| Z | Site Sectors # | Number | Number of sectors | 3 |
| AA | IBS Sector | Boolean | Indoor building system | Yes, No |
| AB | TDD Site | Boolean | TDD technology | Yes, No |

#### Nokia Status (Columns AC-AE)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| AC | Nokia NPO Status | String | NPO validation status | Approved, Pending |
| AD | Nokia NPO Comment | String | NPO comments | Technical review complete |
| AE | Nokia Site Owner | String | Assigned Nokia engineer | Mohammad Ali |

#### Department Statuses (Columns AF-AX)

##### TI (Technical Integration)

| Column | Field Name | Type | Description |
|--------|------------|------|-------------|
| AF | TI Status | String | TI approval status |
| AG | TI Comment | String | TI department comments |
| AH | Cluster Owner (TI) | String | TI cluster owner |

##### RF Planning

| Column | Field Name | Type | Description |
|--------|------------|------|-------------|
| AI | RF Plan Status | String | RF Planning status |
| AJ | RF Plan Comment | String | RF Planning comments |
| AK | Cluster Owner (Planning) | String | Planning cluster owner |

##### RF Optimization

| Column | Field Name | Type | Description |
|--------|------------|------|-------------|
| AL | RF Optim Status | String | RF Optimization status |
| AM | RF Opt. Comment | String | RF Optimization comments |
| AN | Cluster Owner (Optimization) | String | Optimization cluster owner |

##### Civil

| Column | Field Name | Type | Description |
|--------|------------|------|-------------|
| AO | Civil Status | String | Civil engineering status |
| AP | Civil Comment | String | Civil department comments |
| AQ | Cluster Owner (Civil) | String | Civil cluster owner |

##### Microwave

| Column | Field Name | Type | Description |
|--------|------------|------|-------------|
| AR | MW Status | String | Microwave status |
| AS | Cluster Owner (MW) | String | MW cluster owner |

#### TSSR Overall (Columns AT-AW)

| Column | Field Name | Type | Description | Example |
|--------|------------|------|-------------|---------|
| AT | TSSR Overall Status | String | Overall TSSR status | Approved |
| AU | TSSR Status Date | Date | Last status change date | 2025-12-15 |
| AV | TSSR Remark | String | General remarks | All departments approved |
| AW | Action Age | Number | Days since last action | 5 |

#### Additional Fields (Columns AX-BP)

| Column | Field Name | Type | Description |
|--------|------------|------|-------------|
| AX | RFI Status | String | Request for Information status |
| AY | Gap Analysis | String | Gap analysis results |
| AZ | Approved | Boolean | Final approval flag |
| BA | TSSR Ready | Boolean | Ready for TSSR submission |
| BB | Dismantle Status | String | Equipment dismantle status |
| BC-BP | Reserved | Various | Future expansion fields |

### 2.2 Status Value Enumeration

#### TSSR Overall Status

| Status | Description | Count |
|--------|-------------|-------|
| Approved | Fully approved | 1,420 |
| Site not surveyed | Pending survey | 159 |
| Site ID not Identified | Unknown site | 38 |
| Electricity Pole | Special type | 34 |
| undefined Sites | Uncategorized | 16 |
| IBS | Indoor Building System | 13 |
| TSSR Under Subcon validation | Subcon review | 2 |
| survey OG | Survey ongoing | 2 |
| Cancelled | Cancelled | 1 |
| TSSR Under Zain validation | Zain review | 1 |

#### Department Status Values

| Value | Description |
|-------|-------------|
| Approved | Department approved |
| approved | (variant) Department approved |
| Pending | Awaiting action |
| Rejected | Requires rework |
| Under Review | Being reviewed |
| Released | Released for next phase |
| N/A | Not applicable |

---

## 3. Firebase Firestore Schema

### 3.1 Collections Structure

```
firestore/
├── sites/                  # Main site data
│   └── {siteId}/
├── activityLog/           # Activity history
│   └── {logId}/
├── users/                 # User accounts
│   └── {userId}/
├── settings/              # App settings
│   └── {settingId}/
└── syncLog/               # Sync history
    └── {syncId}/
```

### 3.2 Sites Collection

```typescript
// Collection: sites
// Document ID: siteId (e.g., "ZJ-001")

interface SiteDocument {
  // Identification
  siteId: string;               // Primary key
  finalSiteName: string;
  siteCode: string;
  siteType: string;
  keyNumber: string;

  // Location (embedded object)
  location: {
    longitude: number;
    latitude: number;
    governorate: string;
    geoPoint: GeoPoint;         // Firebase GeoPoint for queries
  };

  // Structure
  structure: {
    type: string;
    height: number;
    partOf: string | null;
  };

  // Ownership
  ownership: {
    owner: 'TASC' | 'ZAIN' | 'ZAIN/M';
    ownerName: string;
    contactNumber: string;
  };

  // Project
  project: {
    phaseName: string;
    priority: number;
    cluster: string;
    area: string;
    weeklyPlan: string;
  };

  // Technical
  technical: {
    tssSmp: string;
    tssrSubcon: string;
    newAllocation: string;
    tssrPo: string;
  };

  // 5G Configuration
  fiveG: {
    sectorsNames: string;
    solution: string;
    sectorsCount: number;
    ibsSector: boolean;
    tddSite: boolean;
  };

  // Status (embedded object for each department)
  status: {
    nokia: {
      npoStatus: string;
      npoComment: string;
      siteOwner: string;
    };
    ti: {
      status: string;
      comment: string;
      clusterOwner: string;
    };
    rfPlan: {
      status: string;
      comment: string;
      clusterOwner: string;
    };
    rfOptim: {
      status: string;
      comment: string;
      clusterOwner: string;
    };
    civil: {
      status: string;
      comment: string;
      clusterOwner: string;
    };
    mw: {
      status: string;
      clusterOwner: string;
    };
    tssrOverall: {
      status: string;
      statusDate: Timestamp;
      remark: string;
      actionAge: number;
    };
  };

  // Other flags
  flags: {
    rfiStatus: string;
    gapAnalysis: string;
    approved: boolean;
    tssrReady: boolean;
    dismantleStatus: string;
  };

  // Metadata
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastSyncedFromExcel: Timestamp;
    syncSource: 'excel' | 'manual' | 'api';
    version: number;
  };
}
```

### 3.3 Activity Log Collection

```typescript
// Collection: activityLog
// Document ID: auto-generated

interface ActivityLogDocument {
  id: string;
  
  // Action details
  action: 'STATUS_CHANGE' | 'COMMENT_ADDED' | 'SITE_CREATED' | 
          'SITE_UPDATED' | 'SITE_DELETED' | 'USER_LOGIN' | 
          'SYNC_COMPLETED' | 'EXPORT_GENERATED';
  
  // References
  siteId: string | null;
  userId: string;
  userEmail: string;
  
  // Change tracking
  department: string | null;
  field: string | null;
  previousValue: any;
  newValue: any;
  
  // Context
  source: 'web' | 'desktop' | 'api' | 'sync';
  ipAddress: string;
  userAgent: string;
  
  // Timestamp
  timestamp: Timestamp;
}
```

### 3.4 Users Collection

```typescript
// Collection: users
// Document ID: Firebase Auth UID

interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  
  // Role & Permissions
  role: 'admin' | 'management' | 'contractor' | 'nokia_engineer';
  department: string;
  permissions: Permission[];
  
  // Assignment
  assignedClusters: string[];
  assignedAreas: string[];
  
  // Activity
  lastLogin: Timestamp;
  loginCount: number;
  isActive: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

type Permission = 
  | 'sites.read.all'
  | 'sites.read.assigned'
  | 'sites.update.status'
  | 'sites.update.all'
  | 'tssr.approve'
  | 'reports.generate'
  | 'reports.export'
  | 'users.manage'
  | 'settings.configure';
```

### 3.5 Settings Collection

```typescript
// Collection: settings
// Document ID: 'app' or userId for user-specific

interface SettingsDocument {
  // Excel Configuration
  excel: {
    filePath: string;
    watchEnabled: boolean;
    syncInterval: number;        // milliseconds
    autoSync: boolean;
  };

  // Firebase Configuration
  firebase: {
    projectId: string;
    batchSize: number;
    retryAttempts: number;
  };

  // UI Preferences
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'ar';
    defaultView: 'dashboard' | 'sites' | 'reports';
    itemsPerPage: number;
  };

  // Notifications
  notifications: {
    enabled: boolean;
    sound: boolean;
    statusChanges: boolean;
    syncComplete: boolean;
    errors: boolean;
  };

  // Metadata
  updatedAt: Timestamp;
  updatedBy: string;
}
```

### 3.6 Sync Log Collection

```typescript
// Collection: syncLog
// Document ID: auto-generated

interface SyncLogDocument {
  id: string;
  
  // Sync details
  direction: 'excel_to_firebase' | 'firebase_to_excel';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  
  // Statistics
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  
  // Timing
  startTime: Timestamp;
  endTime: Timestamp | null;
  duration: number | null;       // milliseconds
  
  // Error details (if any)
  errors: Array<{
    siteId: string;
    error: string;
    timestamp: Timestamp;
  }>;
  
  // Metadata
  triggeredBy: 'manual' | 'scheduled' | 'file_change';
  userId: string | null;
}
```

---

## 4. Indexes

### 4.1 Firestore Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "sites",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "location.governorate", "order": "ASCENDING" },
        { "fieldPath": "status.tssrOverall.status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sites",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "project.phaseName", "order": "ASCENDING" },
        { "fieldPath": "metadata.updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activityLog",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "siteId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activityLog",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 5. Data Statistics

### 5.1 Site Distribution

| Governorate | Count | Percentage |
|-------------|-------|------------|
| Amman | 640 | 17.5% |
| Irbid | 583 | 15.9% |
| West Amman | 378 | 10.3% |
| East Amman | 339 | 9.3% |
| Zarqa | 312 | 8.5% |
| Balqa | 255 | 7.0% |
| South Amman | 235 | 6.4% |
| Mafraq | 208 | 5.7% |
| Aqaba | 181 | 4.9% |
| Karak | 174 | 4.8% |
| Ma'an | 125 | 3.4% |
| Madaba | 95 | 2.6% |
| Jarash | 83 | 2.3% |
| Tafila | 57 | 1.6% |
| Ajloun | 56 | 1.5% |
| Airport | 4 | 0.1% |

### 5.2 Ownership Distribution

| Owner | Count | Percentage |
|-------|-------|------------|
| TASC | 2,287 | 78.9% |
| ZAIN | 447 | 15.4% |
| ZAIN/M | 165 | 5.7% |

### 5.3 Phase Distribution

| Phase | Count |
|-------|-------|
| P.O.2 | 374 |
| Phase-2 | 296 |
| PO3 | 268 |
| RO4 | 245 |
| RO2 | 200 |
| RO3 | 153 |
| Phase-1 | 134 |
| Trial Thin Layer | 12 |
| Others | 7 |

---

## 6. Data Quality Rules

### 6.1 Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| Site ID | Required, Unique | ERR_VAL_001 |
| Longitude | -180 to 180 | ERR_VAL_002 |
| Latitude | -90 to 90 | ERR_VAL_003 |
| Height | 0 to 500 meters | ERR_VAL_004 |
| Status | Enum values only | ERR_VAL_005 |

### 6.2 Known Data Issues

| Issue | Count | Recommendation |
|-------|-------|----------------|
| Case inconsistency (Approved/approved) | ~50 | Normalize to Title Case |
| #VALUE! errors | ~10 | Clean source data |
| Duplicate subcontractor names | ~5 variants | Standardize names |

---

*Database Schema Version: 2.0 | Last Updated: December 2025*
