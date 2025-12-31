# TSSR Monitor - API Documentation

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | IPC & Firebase API Reference |
| **Version** | 2.0 |
| **Last Updated** | December 2025 |

---

## 1. IPC API Reference

The application uses Electron's Inter-Process Communication (IPC) for communication between the renderer (React) and main processes.

### 1.1 Excel Operations

#### Read All Sites

```javascript
// Renderer Process
const sites = await window.electronAPI.readExcelData();

// Response
{
  success: true,
  data: [
    {
      siteId: "ZJ-001",
      siteName: "Amman Central",
      governorate: "Amman",
      status: "Approved",
      // ... all 68 columns
    }
  ],
  count: 3791,
  timestamp: "2025-12-15T14:30:00Z"
}
```

#### Read Specific Sheet

```javascript
// Renderer Process
const sheetData = await window.electronAPI.readSheet('Dashboard');

// Parameters
{
  sheetName: string  // One of: Master Sheet, Dashboard, TSSR Status Tracker, etc.
}

// Response
{
  success: true,
  data: Array,
  sheetName: "Dashboard",
  dimensions: "B1:Z43"
}
```

#### Get File Info

```javascript
// Renderer Process
const info = await window.electronAPI.getExcelFileInfo();

// Response
{
  success: true,
  path: "C:\\Data\\TSSR Tracker Zain Jo 5.xlsm",
  lastModified: "2025-12-15T10:00:00Z",
  size: 2936012,  // bytes
  sheets: 17
}
```

### 1.2 Firebase Operations

#### Sync to Firebase

```javascript
// Renderer Process
const result = await window.electronAPI.syncToFirebase(data);

// Parameters
{
  data: Array<SiteObject>,
  batchSize: 500  // optional, default 500
}

// Response
{
  success: true,
  synced: 3791,
  batches: 8,
  duration: 45000,  // milliseconds
  timestamp: "2025-12-15T14:30:00Z"
}
```

#### Read from Firebase

```javascript
// Renderer Process
const sites = await window.electronAPI.readFromFirebase(query);

// Parameters
{
  collection: "sites",
  filters: {
    governorate: "Amman",
    status: "Approved"
  },
  limit: 100,
  orderBy: "siteName"
}

// Response
{
  success: true,
  data: Array<SiteObject>,
  count: 640,
  hasMore: true
}
```

#### Subscribe to Real-time Updates

```javascript
// Renderer Process
window.electronAPI.onFirebaseUpdate((data) => {
  console.log('Real-time update:', data);
});

// Callback Data
{
  type: "modified" | "added" | "removed",
  siteId: "ZJ-001",
  data: SiteObject,
  timestamp: "2025-12-15T14:30:00Z"
}
```

### 1.3 Settings Operations

#### Get Settings

```javascript
// Renderer Process
const settings = await window.electronAPI.getSettings();

// Response
{
  excelPath: "C:\\Data\\TSSR Tracker.xlsm",
  syncInterval: 300000,
  autoSync: true,
  theme: "light",
  language: "en"
}
```

#### Update Settings

```javascript
// Renderer Process
await window.electronAPI.updateSettings({
  syncInterval: 600000,
  autoSync: false
});

// Response
{
  success: true,
  settings: UpdatedSettingsObject
}
```

### 1.4 Authentication

#### Login

```javascript
// Renderer Process
const auth = await window.electronAPI.login(credentials);

// Parameters
{
  email: "user@nokia.com",
  password: "********",
  role: "nokia_engineer"
}

// Response
{
  success: true,
  user: {
    uid: "user123",
    email: "user@nokia.com",
    role: "nokia_engineer",
    permissions: ["read", "update_status"]
  },
  token: "eyJhbGc..."
}
```

#### Logout

```javascript
// Renderer Process
await window.electronAPI.logout();

// Response
{
  success: true
}
```

---

## 2. Data Models

### 2.1 Site Object

```typescript
interface Site {
  // Basic Info
  siteId: string;
  finalSiteName: string;
  siteCode: string;
  siteType: string;
  keyNumber: string;

  // Location
  longitude: number;
  latitude: number;
  governorate: string;

  // Structure
  structureType: string;
  height: number;
  partOf: string;

  // Ownership
  siteOwner: 'TASC' | 'ZAIN' | 'ZAIN/M';
  ownerName: string;
  ownerContactNumber: string;

  // Project
  phaseName: string;
  priority: number;
  cluster: string;
  area: string;
  weeklyPlan: string;

  // Technical
  tssSmp: string;
  tssrSubcon: string;
  newAllocation: string;
  tssrPo: string;

  // 5G Info
  fiveGSectorsNames: string;
  fiveGSolution: string;
  siteSectorsNumber: number;
  ibsSector: boolean;
  tddSite: boolean;

  // Nokia Status
  nokiaNpoStatus: Status;
  nokiaNpoComment: string;
  nokiaSiteOwner: string;

  // Department Statuses
  tiStatus: Status;
  tiComment: string;
  clusterOwnerTi: string;

  rfPlanStatus: Status;
  rfPlanComment: string;
  clusterOwnerPlanning: string;

  rfOptimStatus: Status;
  rfOptComment: string;
  clusterOwnerOptimization: string;

  civilStatus: Status;
  civilComment: string;
  clusterOwnerCivil: string;

  mwStatus: Status;
  clusterOwnerMw: string;

  // TSSR Status
  tssrOverallStatus: string;
  tssrStatusDate: Date;
  tssrRemark: string;
  actionAge: number;

  // Other
  rfiStatus: string;
  gapAnalysis: string;
  approved: boolean;
  tssrReady: boolean;
  dismantleStatus: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

type Status = 'Approved' | 'Pending' | 'Rejected' | 'Under Review' | 'Released' | 'N/A';
```

### 2.2 User Object

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'management' | 'contractor' | 'nokia_engineer';
  department: string;
  permissions: Permission[];
  lastLogin: Date;
  createdAt: Date;
}

type Permission = 
  | 'read_all'
  | 'read_assigned'
  | 'update_status'
  | 'approve_tssr'
  | 'generate_reports'
  | 'manage_users'
  | 'system_config'
  | 'export_data';
```

### 2.3 Activity Log Object

```typescript
interface ActivityLog {
  id: string;
  action: 'STATUS_CHANGE' | 'COMMENT_ADDED' | 'SITE_UPDATED' | 'USER_LOGIN';
  siteId: string;
  userId: string;
  previousValue: any;
  newValue: any;
  department: string;
  timestamp: Date;
  ipAddress: string;
}
```

---

## 3. Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Sites collection
    match /sites/{siteId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && hasPermission('update_status');
      allow delete: if isAdmin();
    }
    
    // Activity logs
    match /activityLog/{logId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow write: if isAdmin();
    }
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasPermission(permission) {
      return permission in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.permissions;
    }
  }
}
```

---

## 4. Error Codes

### 4.1 Excel Errors

| Code | Description | Resolution |
|------|-------------|------------|
| ERR_EXCEL_001 | File not found | Verify file path |
| ERR_EXCEL_002 | File is locked | Close Excel application |
| ERR_EXCEL_003 | Invalid format | Ensure .xlsm format |
| ERR_EXCEL_004 | Sheet not found | Check sheet name |
| ERR_EXCEL_005 | Parse error | Check file integrity |

### 4.2 Firebase Errors

| Code | Description | Resolution |
|------|-------------|------------|
| ERR_FB_001 | Connection failed | Check internet |
| ERR_FB_002 | Quota exceeded | Wait or upgrade plan |
| ERR_FB_003 | Permission denied | Check user permissions |
| ERR_FB_004 | Document not found | Verify document ID |
| ERR_FB_005 | Batch write failed | Reduce batch size |

### 4.3 Authentication Errors

| Code | Description | Resolution |
|------|-------------|------------|
| ERR_AUTH_001 | Invalid credentials | Check email/password |
| ERR_AUTH_002 | Token expired | Re-login |
| ERR_AUTH_003 | Account disabled | Contact admin |
| ERR_AUTH_004 | Too many attempts | Wait 15 minutes |

---

## 5. Event Listeners

### 5.1 Available Events

```javascript
// File change detected
window.electronAPI.onFileChanged((event) => {
  // event: { path, changeType }
});

// Sync status changed
window.electronAPI.onSyncStatus((status) => {
  // status: 'syncing' | 'success' | 'error' | 'idle'
});

// Firebase real-time update
window.electronAPI.onFirebaseUpdate((data) => {
  // data: { type, siteId, data }
});

// Error occurred
window.electronAPI.onError((error) => {
  // error: { code, message, details }
});
```

---

## 6. Rate Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Firebase Reads | 50,000/day | Daily reset |
| Firebase Writes | 20,000/day | Daily reset |
| Excel Reads | No limit | - |
| API Calls | 100/minute | Per user |

---

*API Documentation Version: 2.0 | Last Updated: December 2025*
