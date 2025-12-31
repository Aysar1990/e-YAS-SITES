# TSSR Monitor - 3-Week Implementation Plan
## Database Migration & Import System Enhancement

---

## 📋 Project Overview

**Objective:** Transform TSSR Monitor from Excel-dependent to database-driven architecture while maintaining existing Desktop Server/Client functionality and adding custom batch/single file import processors.

**Current Architecture:** 
- Desktop app (Electron + React 18)
- SQLite local database (sites_cache table)
- Server/Client mode via REST API (port 3001) + WebSocket (port 3002)
- Excel file as primary data source (3,791 sites, 68 columns)
- Real-time collaboration for 10-20 concurrent users

**Target Architecture:**
- Keep existing Desktop Server/Client infrastructure
- Add Supabase as optional cloud database (toggle-able with SQLite)
- Custom import processors for batch and single Excel files
- Real-time database updates broadcast to all connected clients
- Maintain Excel compatibility for reports and exports

**Timeline:** 3 weeks (15 working days)

**Scope:** 245 sites from RO4 phase initially, expandable to other phases

---

## 🎯 Key Requirements

### 1. Database Layer
- Dual database support: SQLite (existing) OR Supabase (new)
- User can toggle between databases via Settings UI
- Same API interface regardless of database choice
- Adapter pattern for database abstraction

### 2. Import System
- **Batch Import:** Process 1-50 Excel files simultaneously with custom processing rules (to be defined by user later)
- **Single File Import:** Process individual Excel files with different custom processing rules (to be defined by user later)
- Both import types update database and broadcast changes to all clients in real-time
- Validation and error handling for both import types

### 3. Real-time Updates
- Database changes (from imports or edits) broadcast via existing WebSocket
- All connected clients see updates within 3-5 seconds
- No manual refresh needed

### 4. Excel Integration
- Import: Custom processors for batch and single files
- Export: Generate Excel reports matching original format
- Maintain compatibility with existing 17-worksheet structure

---

## 📁 Existing Files Analysis

### Database Layer (Examined)
**File:** `electron/database/db.js` (226 lines)
- Current implementation uses SQL.js (in-memory SQLite)
- Auto-save every 30 seconds
- Migration system with 4 SQL files (001_initial.sql through 004_audit_logs.sql)
- Tables: sites_cache (68 columns), users, activity_log, rejections_log, sync_log
- Indexes on phase, contractor, status, governorate, site_id

**Migration Files:** `electron/database/migrations/`
- 001_initial.sql - Initial schema
- 002_users_table.sql - User management
- 003_sync_tables.sql - Sync tracking
- 004_audit_logs.sql - Activity logging

### Excel Integration (Examined)
**File:** `electron/services/excelReader.js` (551 lines)
- Reads .xlsm/.xlsx files with auto-header detection
- Clears AutoFilters to ensure all rows are read (critical fix)
- Validates data integrity (expects 3,791 rows, 50+ columns)
- Supports Data/Export/Master sheet priority
- Returns array of site objects with 68 fields

**File:** `src/services/importService.js` (265 lines)
- Frontend Excel parsing using XLSX library
- COLUMN_MAPPING object defining 68 fields
- parseExcelFile() function for browser-based import
- Firebase batch import structure (partially implemented)

### Server/Client Architecture (Examined)
**File:** `electron/standaloneServer.js` (167 lines)
- Standalone Node.js server (no Electron GUI)
- Initializes database, starts API server, sets up auto-sync
- Excel sync every 5 minutes from default paths
- Graceful shutdown handling
- Network info display (IP addresses, ports)

**File:** `electron/server/apiServer.js` (171 lines)
- Express REST API on port 3001
- CORS enabled for all origins
- Routes: auth, sites, stats, contractors, nokia-reviews, users, audit-logs, backups
- Middleware: authenticateToken, logging
- WebSocket server integration for broadcasting
- Health check endpoint: GET /api/health

**File:** `electron/server/websocket.js` (141 lines)
- WebSocket server on port 3002
- Broadcast system for real-time updates
- Client connection tracking with unique IDs
- Event types: connection_status, data_synced, nokia_review_updated, user_logged_in, notification
- Ping/pong heartbeat support

### Frontend Integration (Examined)
**File:** `src/context/DataContext.jsx` (416 lines)
- Determines API source: Client mode (via ApiClient) or Electron IPC
- State management: sites, stats, settings, phases, contractors
- Real-time event listeners for client mode:
  - onConnectionStatus
  - onNokiaReviewUpdated
  - onDataSynced
  - onUserLoggedIn
  - onNotification
- WebSocket connection management
- Pending updates indicator for user-triggered refresh

**File:** `src/pages/ClientSetup/ClientSetup.jsx` (162 lines)
- Client mode connection screen
- Server IP input and validation
- Connection testing via /api/health endpoint
- 5-second timeout for connection attempts
- Saves configuration to localStorage

### Edit System (Examined)
**File:** `src/components/EditSiteModal/EditSiteModal.jsx` (487 lines)
- Department status editing: TI, RF Plan, RF Optim, Civil, MW, Nokia NPO
- Auto-calculation of overall status from department statuses
- Edit history tracking with timestamps
- Comments system per department
- Admin-only permissions enforcement
- Firebase update support (partial implementation with timeout issues)

### Firebase Integration (Examined - Partial)
**File:** `electron/services/firebaseService.js` (152 lines)
- Firebase project: playstation-way
- User management functions working
- Read operations functional
- Write operations timeout (permissions issue identified)
- Toggle between Local/Firebase data sources
- Service account credentials configured

---

## 📅 WEEK 1: Database Layer Enhancement

### Goal
Add Supabase as an optional cloud database while keeping SQLite as default. Implement adapter pattern for seamless switching.

### Day 1-2: Database Adapter Pattern

#### New Files to Create:

**1. `electron/database/adapters/baseAdapter.js`** (~50 lines)
- Purpose: Define interface that all database adapters must implement
- Methods to define:
  - initialize(): Set up database connection
  - prepare(sql): Prepare SQL statement
  - exec(sql): Execute SQL directly
  - close(): Close database connection
  - transaction(callback): Execute transaction
  - backup(): Create database backup
- Export: BaseAdapter class

**2. `electron/database/adapters/sqliteAdapter.js`** (~100 lines)
- Purpose: Wrap existing SQLite implementation to conform to adapter interface
- Extends: BaseAdapter
- Wraps: Current SQL.js implementation from db.js
- Methods:
  - All methods from BaseAdapter
  - getSqlite(): Return underlying SQL.js database instance
- Migration: Move existing SQLite code from db.js to this adapter

**3. `electron/database/adapters/supabaseAdapter.js`** (~300 lines)
- Purpose: Implement Supabase database adapter
- Extends: BaseAdapter
- Dependencies: @supabase/supabase-js
- Connection:
  - Use environment variables for Supabase URL and API key
  - Initialize Supabase client on construction
- Methods:
  - translate SQL.js syntax to Supabase queries
  - prepare(): Convert SQL to Supabase query builder syntax
  - exec(): Execute Supabase queries
  - Real-time subscription setup for data changes
- Error handling: Wrap Supabase errors in standardized format

#### Files to Modify:

**1. `electron/database/db.js`** (modify ~50 lines)
- Current: Direct SQLite implementation (226 lines)
- Changes needed:
  - Add adapter selection logic based on settings
  - Load either sqliteAdapter or supabaseAdapter
  - Wrap all database calls through selected adapter
  - Maintain same public API (prepare, exec, etc.)
  - Add getAdapter() method for direct adapter access
- Keep: Migration system, auto-save logic (for SQLite mode)
- Remove: Direct SQL.js initialization (move to sqliteAdapter)

**2. `package.json`** (add 1 dependency)
- Add: "@supabase/supabase-js": "^2.39.0"
- Location: dependencies section

#### Deliverables:
- ✅ Three adapter files created
- ✅ db.js refactored to use adapters
- ✅ Same API works for both SQLite and Supabase
- ✅ No breaking changes to existing code

---

### Day 3: Data Migration Script

#### New Files to Create:

**1. `electron/scripts/migrate-to-supabase.js`** (~200 lines)
- Purpose: One-time migration of data from SQLite to Supabase
- Process:
  1. Read all sites from SQLite database (sites_cache table)
  2. Filter RO4 phase sites (245 sites)
  3. Transform data to Supabase format
  4. Upload in batches (50 sites per batch to avoid rate limits)
  5. Verify each batch upload
  6. Generate migration report
- Features:
  - Progress indicator (console output)
  - Error handling with retry logic (3 attempts)
  - Rollback on critical failure
  - Detailed log file: migration_YYYYMMDD_HHMMSS.log
  - Summary report: sites migrated, errors encountered, time taken
- Usage: `node electron/scripts/migrate-to-supabase.js`

**2. `electron/scripts/verify-migration.js`** (~100 lines)
- Purpose: Verify data integrity after migration
- Process:
  1. Count records in SQLite vs Supabase
  2. Sample random sites and compare field-by-field
  3. Check for missing or null critical fields
  4. Validate data types and formats
- Output: Console report + verification_YYYYMMDD.log

#### Files to Reference:
- `electron/database/db.js` - Access SQLite data
- `electron/database/adapters/supabaseAdapter.js` - Upload to Supabase
- `electron/services/excelReader.js` - Column mapping reference

#### Deliverables:
- ✅ Migration script ready
- ✅ Verification script ready
- ✅ 245 RO4 sites in Supabase (after execution)
- ✅ Migration log file
- ✅ 100% data integrity verified

---

### Day 4: Settings UI Enhancement

#### Files to Modify:

**1. `src/pages/Settings/Settings.jsx`** (add ~50 lines)
- Current: Settings page with various application settings
- New section to add: "Database Configuration"
- UI Elements:
  - Radio buttons: SQLite vs Supabase
  - Supabase configuration fields (URL, API Key) - shown only when Supabase selected
  - Test Connection button
  - Apply button
  - Connection status indicator (green/red dot)
- Functionality:
  - Save selection to localStorage or settings table
  - Test connection before applying
  - Show loading state during test
  - Display success/error messages
  - Require app restart if database changed (show warning)
- Layout:
  ```
  Database Settings
  ○ SQLite (Local - Fast, Offline)
  ○ Supabase (Cloud - Real-time, Multi-user)
  
  [If Supabase selected:]
  Supabase URL: [________________]
  API Key: [________________]
  
  [Test Connection] [Apply]
  ```

**2. `electron/ipc/settingsHandlers.js`** (add ~30 lines, if exists; or create new)
- Purpose: Handle Settings IPC communication
- New handlers:
  - 'get-database-type': Return current database selection
  - 'set-database-type': Update database type in settings
  - 'test-database-connection': Test connection to selected database
  - 'get-supabase-config': Return Supabase configuration
  - 'set-supabase-config': Save Supabase URL and API key
- Response format: { success: boolean, message: string, data?: any }

**3. `.env.example`** (create if doesn't exist)
- Add Supabase environment variables template:
  ```
  SUPABASE_URL=your_supabase_url
  SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_KEY=your_service_key
  ```

#### Deliverables:
- ✅ Settings UI with database toggle
- ✅ Test connection functionality
- ✅ IPC handlers for settings
- ✅ Environment variable template

---

### Day 5: Integration Testing

#### Test Files to Create:

**1. `tests/database-adapter.test.js`** (~100 lines)
- Test SQLite adapter:
  - Initialize connection
  - Insert site record
  - Query site record
  - Update site record
  - Delete site record
  - Transaction support
  - Error handling
- Test Supabase adapter:
  - Same tests as SQLite
  - Real-time subscription setup
  - Connection pooling
  - Rate limiting handling
- Test adapter switching:
  - Start with SQLite
  - Switch to Supabase
  - Verify data persists
  - Switch back to SQLite

**2. `tests/websocket-broadcast.test.js`** (~80 lines)
- Test scenarios:
  - Database insert → WebSocket broadcast
  - Database update → WebSocket broadcast
  - Multiple clients receive update
  - Broadcast excludes sender (if applicable)
- Mock WebSocket clients
- Verify event data structure

#### Manual Testing Checklist:
- [ ] Launch app with SQLite (default)
- [ ] Insert test site
- [ ] Switch to Supabase in Settings
- [ ] Restart app
- [ ] Verify test site appears
- [ ] Insert another test site via Supabase
- [ ] Open second client instance
- [ ] Edit site in first client
- [ ] Verify update appears in second client within 5 seconds

#### Deliverables:
- ✅ All adapter tests passing
- ✅ WebSocket broadcast tests passing
- ✅ Manual testing completed
- ✅ Issues documented and resolved

---

## 📅 WEEK 2: Custom Import System

### Goal
Build flexible import system for batch and single file processing with custom rule placeholders ready for user-defined logic.

### Day 1-2: Batch Import Processor

#### New Files to Create:

**1. `electron/services/importProcessors/batchProcessor.js`** (~400 lines)
- Purpose: Process multiple Excel files with custom batch rules
- Class: BatchProcessor
- Methods:
  - **validateBatch(files):**
    - Check file extensions (.xlsx, .xlsm)
    - Verify file sizes (< 10MB each)
    - Check for duplicate filenames
    - Return: { valid: File[], invalid: { file: File, reason: string }[] }
  - **processBatch(files):**
    - Main orchestration method
    - Call validateBatch first
    - Process valid files in parallel (Promise.all)
    - Apply custom rules via applyBatchRules
    - Save to database
    - Broadcast updates
    - Return: { success: number, failed: number, errors: any[] }
  - **applyBatchRules(filesData):**
    - **PLACEHOLDER for user's custom batch processing logic**
    - Input: Array of parsed Excel data objects
    - Output: Processed and validated site objects
    - **TODO comment:** User will define specific batch rules here later
  - **readExcelFile(file):**
    - Use existing excelReader.js logic
    - Parse to array of objects with 68 columns
  - **saveBatchToDb(sites):**
    - Use database adapter's batch insert
    - Handle conflicts (upsert vs insert)
  - **broadcastUpdate(eventData):**
    - Call wsServer.broadcast('batch_imported', data)
- Error handling:
  - Try-catch for each file
  - Continue processing on individual file failure
  - Collect all errors for reporting

**2. `electron/services/importProcessors/importTypes.js`** (~50 lines)
- Purpose: Define constants and types for import system
- Exports:
  - IMPORT_TYPE: { BATCH: 'batch', SINGLE: 'single' }
  - FILE_VALIDATION_RULES: { maxSize, allowedExtensions, maxBatchSize }
  - BATCH_PROCESSING_STATUS: { PENDING, VALIDATING, PROCESSING, COMPLETED, FAILED }
  - ERROR_CODES: { INVALID_FILE, DUPLICATE, SIZE_LIMIT, etc. }
- TypeScript-style JSDoc comments for type safety

#### Files to Reference:
- `electron/services/excelReader.js` - Excel parsing logic
- `electron/database/db.js` - Database operations
- `electron/server/websocket.js` - Broadcasting

#### Files That Will Use This:
- New IPC handlers (Day 5)
- Frontend Import UI (Day 4)

#### Deliverables:
- ✅ BatchProcessor class created
- ✅ Validation logic working
- ✅ Placeholder for custom rules clearly marked
- ✅ Database integration working
- ✅ WebSocket broadcast working

---

### Day 3: Single File Import Processor

#### New Files to Create:

**1. `electron/services/importProcessors/singleFileProcessor.js`** (~300 lines)
- Purpose: Process individual Excel file with different custom rules than batch
- Class: SingleFileProcessor
- Methods:
  - **validateFile(file):**
    - Check file extension
    - Verify file size
    - Check if file is readable
    - Return: { valid: boolean, error?: string }
  - **processSingleFile(file):**
    - Main orchestration method
    - Validate file first
    - Read Excel data
    - Apply custom rules via applySingleFileRules
    - Save to database
    - Broadcast update
    - Return: { success: boolean, data?: object, error?: string }
  - **applySingleFileRules(fileData):**
    - **PLACEHOLDER for user's custom single file processing logic**
    - Input: Parsed Excel data object
    - Output: Processed and validated site object
    - **TODO comment:** User will define specific single file rules here later
    - **Note:** Different from batch rules - user may have different validation/processing needs
  - **readExcelFile(file):**
    - Same as batch processor
    - Parse to object with 68 columns
  - **saveFileToDb(site):**
    - Use database adapter's insert/upsert
    - Handle primary key conflicts
  - **broadcastUpdate(eventData):**
    - Call wsServer.broadcast('file_imported', data)
- Differences from Batch:
  - Single file means synchronous processing (no parallelization)
  - More detailed error reporting per file
  - Different custom rules may apply

#### Files to Reference:
- `electron/services/excelReader.js` - Excel parsing
- `electron/database/db.js` - Database operations
- `electron/server/websocket.js` - Broadcasting

#### Deliverables:
- ✅ SingleFileProcessor class created
- ✅ Validation logic working
- ✅ Placeholder for custom rules clearly marked
- ✅ Database integration working
- ✅ WebSocket broadcast working

---

### Day 4: Frontend Import UI Components

#### New Files to Create:

**1. `src/components/Import/BatchImport.jsx`** (~200 lines)
- Purpose: UI for batch Excel import
- Features:
  - Drag & drop zone for multiple files (1-50 files)
  - File browser button
  - File list with validation status (green checkmark or red X)
  - Remove file button for each file
  - Preview button to see parsed data
  - Import button (disabled until validation passes)
  - Progress indicator during import (percentage bar)
  - Results summary: X files imported, Y failed
  - Error details accordion for failed files
- State management:
  - selectedFiles: File[]
  - validationResults: Map<filename, validationStatus>
  - importProgress: number (0-100)
  - importResults: { success: number, failed: number, errors: any[] }
- IPC calls:
  - window.electron.invoke('validate-batch', files)
  - window.electron.invoke('import-batch', files)

**2. `src/components/Import/SingleFileImport.jsx`** (~150 lines)
- Purpose: UI for single Excel file import
- Features:
  - Drag & drop zone for one file only
  - File browser button
  - File preview (show filename, size, validation status)
  - Data preview table (first 10 rows)
  - Import button
  - Progress indicator
  - Success/error message display
- State management:
  - selectedFile: File | null
  - validationStatus: { valid: boolean, message: string }
  - previewData: any[]
  - importing: boolean
  - result: { success: boolean, message: string }
- IPC calls:
  - window.electron.invoke('validate-single', file)
  - window.electron.invoke('import-single', file)
  - window.electron.invoke('preview-excel', file)

**3. `src/components/Import/ImportPage.jsx`** (~100 lines)
- Purpose: Container page with tabs for both import types
- Layout:
  - Tab navigation: Batch | Single File
  - Tab content area renders BatchImport or SingleFileImport
  - Instructions panel (collapsible)
  - Recent imports history (last 10 imports)
- Routing: /import

**4. `src/components/Import/ImportPage.css`** (~150 lines)
- Styling for all import components
- Drag & drop zone styling (dashed border, hover effects)
- File list styling
- Progress bar styling
- Tab navigation styling
- Responsive design for smaller screens

#### Files to Modify:

**1. `src/App.jsx`** or routing file (add ~5 lines)
- Add route: /import -> ImportPage
- Add navigation menu item if not exists

#### Files to Reference:
- `src/components/EditSiteModal/EditSiteModal.jsx` - Modal patterns
- Existing TSSR styling for consistency

#### Deliverables:
- ✅ Batch import UI working
- ✅ Single file import UI working
- ✅ File validation feedback
- ✅ Progress indicators
- ✅ Error handling display

---

### Day 5: IPC Handlers for Import

#### New Files to Create:

**1. `electron/ipc/importHandlers.js`** (~150 lines)
- Purpose: Bridge between frontend Import UI and backend processors
- Handlers to implement:
  - **'validate-batch':** (files: File[])
    - Call batchProcessor.validateBatch(files)
    - Return validation results to frontend
  - **'import-batch':** (files: File[])
    - Call batchProcessor.processBatch(files)
    - Send progress updates via IPC events
    - Return final results
  - **'validate-single':** (file: File)
    - Call singleFileProcessor.validateFile(file)
    - Return validation result
  - **'import-single':** (file: File)
    - Call singleFileProcessor.processSingleFile(file)
    - Send progress updates
    - Return result
  - **'preview-excel':** (file: File)
    - Read first 10 rows from Excel
    - Return preview data for display
- Progress events:
  - Send via mainWindow.webContents.send('import-progress', { percent, status })
  - Frontend listens with window.electron.onImportProgress(callback)
- Error handling:
  - Wrap all handlers in try-catch
  - Return structured errors: { success: false, error: { code, message } }

#### Files to Modify:

**1. `electron/main.js`** or main entry point (add ~5 lines)
- Import importHandlers
- Register handlers: importHandlers.register(ipcMain)

**2. `electron/preload.js`** (add ~20 lines)
- Expose import IPC methods to renderer:
  - validateBatch: (files) => ipcRenderer.invoke('validate-batch', files)
  - importBatch: (files) => ipcRenderer.invoke('import-batch', files)
  - validateSingle: (file) => ipcRenderer.invoke('validate-single', file)
  - importSingle: (file) => ipcRenderer.invoke('import-single', file)
  - previewExcel: (file) => ipcRenderer.invoke('preview-excel', file)
  - onImportProgress: (callback) => ipcRenderer.on('import-progress', callback)

#### Files to Reference:
- `electron/ipc/dataHandlers.js` - Existing IPC patterns
- `electron/services/importProcessors/batchProcessor.js` - Backend processor
- `electron/services/importProcessors/singleFileProcessor.js` - Backend processor

#### Deliverables:
- ✅ All IPC handlers registered
- ✅ Frontend can call backend import functions
- ✅ Progress updates working
- ✅ Error messages propagate correctly

---

## 📅 WEEK 3: Real-time, Calculations & Polish

### Goal
Enable real-time synchronization, migrate Excel VBA logic to JavaScript, implement report generation, and finalize production readiness.

### Day 1: Real-time Subscriptions

#### New Files to Create:

**1. `electron/services/realtimeSync.js`** (~200 lines)
- Purpose: Subscribe to database changes and broadcast to all clients
- Class: RealtimeSync
- Methods:
  - **initialize():**
    - Determine database type (SQLite or Supabase)
    - If Supabase: Set up real-time subscriptions
    - If SQLite: Set up file watcher or polling mechanism
  - **subscribeToChanges():**
    - Supabase mode:
      - Subscribe to 'sites' table changes
      - Listen for INSERT, UPDATE, DELETE events
    - SQLite mode:
      - Poll database every 2 seconds for changes
      - Use 'updated_at' timestamp to detect changes
  - **handleRemoteUpdate(payload):**
    - Process database change event
    - Format data for WebSocket broadcast
    - Call broadcastToClients
  - **broadcastToClients(event, data):**
    - Use wsServer.broadcast from websocket.js
    - Events: 'site_added', 'site_updated', 'site_deleted'
    - Include metadata: timestamp, changed_by, change_type
- Integration:
  - Start when server starts (standaloneServer.js)
  - Stop when server stops

#### Files to Modify:

**1. `electron/standaloneServer.js`** (add ~20 lines)
- Import realtimeSync
- Initialize in initialize() method: this.realtimeSync = new RealtimeSync()
- Start subscriptions: await this.realtimeSync.subscribeToChanges()
- Stop in shutdown: this.realtimeSync.stop()

**2. `src/context/DataContext.jsx`** (modify ~30 lines)
- Already has WebSocket listeners (examined earlier)
- Ensure listeners handle new events:
  - 'site_added': Add to sites array
  - 'site_updated': Update in sites array
  - 'site_deleted': Remove from sites array
- Update UI state automatically
- Show toast notification for changes

#### Files to Reference:
- `electron/server/websocket.js` - Broadcasting mechanism
- `electron/database/adapters/supabaseAdapter.js` - Supabase subscriptions

#### Deliverables:
- ✅ Real-time sync service created
- ✅ Supabase subscriptions working
- ✅ SQLite polling working
- ✅ WebSocket broadcasts working
- ✅ All clients receive updates within 3-5 seconds

---

### Day 2: VBA Logic Migration to JavaScript

#### Background:
The original Excel file (TSSR_Tracker_Analysis.md examined) contains VBA macros for:
- Auto-calculations (Action Age, totals, aging days)
- Data validation rules
- Status workflow automation (TI → RF Planning → RF Optimization → Civil → MW)
- Activity logging
- Trigger-based updates

#### New Files to Create:

**1. `electron/services/calculations/autoCalculations.js`** (~150 lines)
- Purpose: Automatic calculations that were previously VBA macros
- Functions:
  - **calculateActionAge(site):**
    - Input: site object with tsrStatusDate
    - Output: Number of days since status date
    - Formula: (today - tsrStatusDate) in days
  - **calculateOverallStatus(site):**
    - Input: site object with department statuses (TI, RF Plan, RF Optim, Civil, MW)
    - Logic:
      - If all departments 'Approved' → 'Approved'
      - If any 'Rejected' → 'Rejected'
      - If any 'Pending' → 'TSSR Under [Department] Review'
      - Prioritize earliest department in workflow
    - Output: Overall status string
  - **calculateTotals(sites):**
    - Input: Array of all sites
    - Output: Object with counts:
      - totalSites, approvedCount, pendingCount, rejectedCount
      - byPhase: { RO4: X, Phase-2: Y, ... }
      - byGovernorate: { Amman: X, Zarqa: Y, ... }
  - **updateAgingDays(site):**
    - Calculate days in current status
    - Update site.agingDays field
- Usage: Called automatically on site update and on dashboard load

**2. `electron/services/calculations/validation.js`** (~100 lines)
- Purpose: Data validation rules from Excel
- Constants:
  - VALIDATION_RULES: Object defining rules per field
    - Required fields: site_id, site_name, governorate
    - Enum values: status (Approved/Pending/Rejected), governorate (16 values)
    - Number ranges: priority (1-10), height_m (0-100)
    - String patterns: site_id format, contact number format
- Functions:
  - **validateSite(site):**
    - Check all required fields present
    - Validate enum values
    - Validate number ranges
    - Validate string patterns
    - Return: { valid: boolean, errors: string[] }
  - **validateField(fieldName, value):**
    - Validate single field against rules
    - Return: { valid: boolean, error?: string }

**3. `electron/services/calculations/workflow.js`** (~100 lines)
- Purpose: Multi-department approval workflow automation
- Constants:
  - WORKFLOW_SEQUENCE: ['TI', 'RF Planning', 'RF Optimization', 'Civil', 'MW']
  - STATUS_TRANSITIONS: Valid status changes per department
- Functions:
  - **validateStatusChange(department, oldStatus, newStatus):**
    - Check if transition is allowed
    - Return: { valid: boolean, reason?: string }
  - **autoProgressWorkflow(site):**
    - If department becomes 'Approved', check if next department should auto-start
    - Logic from original Excel workflow
  - **checkWorkflowComplete(site):**
    - Return true if all departments approved
  - **getNextPendingDepartment(site):**
    - Return first department that is still 'Pending'
- Integration: Called when EditSiteModal saves changes

#### Files to Modify:

**1. `src/components/EditSiteModal/EditSiteModal.jsx`** (modify ~50 lines)
- Currently: Manual status updates (examined earlier - 487 lines)
- Changes:
  - Import autoCalculations, validation, workflow
  - On status change: Call validateStatusChange before saving
  - On save: Call calculateOverallStatus and updateAgingDays
  - On save: Call autoProgressWorkflow
  - Update UI with validation errors if any
  - Show calculated overall status (read-only field)

**2. `electron/ipc/dataHandlers.js`** (add ~30 lines)
- Add calculations to site updates:
  - Before saving site: Run calculations
  - Before saving site: Run validation
  - If validation fails: Return error to frontend
  - If validation passes: Save with calculated fields

#### Files to Reference:
- `TSSR_Tracker_Analysis.md` - Original Excel workflow documentation
- `src/components/EditSiteModal/EditSiteModal.jsx` - Current edit logic

#### Deliverables:
- ✅ Auto-calculations working (Action Age, Overall Status)
- ✅ Validation rules implemented
- ✅ Workflow automation working
- ✅ Calculations run on every site update
- ✅ EditSiteModal integrated with calculations

---

### Day 3: Excel Report Generation

#### New Files to Create:

**1. `electron/services/reportGenerator.js`** (~300 lines)
- Purpose: Generate Excel reports matching original TSSR Tracker format
- Dependencies: exceljs library
- Class: ReportGenerator
- Methods:
  - **generateFullReport(sites, options):**
    - Create workbook with 17 sheets (matching original)
    - Sheets to include:
      - Master Sheet: All site data (68 columns)
      - Dashboard: Summary KPIs
      - TSSR Status Tracker: Status change history
      - Pending Sheet: Sites awaiting action
      - Customer Report: Stakeholder summary
      - Weekly Plan: Task allocation
      - Nokia Report: Nokia-specific view
      - Rejection Sheet: Rejected TSSRs with reasons
      - ActivityLog: System activity
    - Apply original Excel formatting:
      - Column widths
      - Header colors (turquoise #8FD9D9 for YAS branding)
      - Data validation dropdowns
      - Conditional formatting for status colors
    - Return: Excel file buffer
  - **generatePhaseReport(phase, sites):**
    - Filtered report for specific phase (e.g., RO4)
    - Same sheet structure as full report
    - Only include sites matching phase
  - **generateCustomReport(filters, columns):**
    - User-defined filters and column selection
    - Generate report with specified columns only
    - Apply filters: governorate, contractor, status, etc.
  - **applyFormatting(worksheet):**
    - Helper method to apply Excel formatting
    - Headers: Bold, turquoise background (#8FD9D9)
    - Status cells: Conditional colors (green/yellow/red)
    - Number formats for dates, percentages
  - **addDashboardSheet(workbook, stats):**
    - Create dashboard with charts and KPIs
    - Pivot tables for governorate and contractor breakdowns
    - Status distribution chart
- Formatting reference: Original Excel file structure from TSSR_Tracker_Analysis.md

**2. `electron/ipc/reportHandlers.js`** (~80 lines)
- Purpose: IPC handlers for report generation
- Handlers:
  - **'generate-full-report':** (options)
    - Call reportGenerator.generateFullReport
    - Save to user's Downloads folder
    - Return file path
  - **'generate-phase-report':** (phase, options)
    - Call reportGenerator.generatePhaseReport
    - Return file path
  - **'generate-custom-report':** (filters, columns)
    - Call reportGenerator.generateCustomReport
    - Return file path
  - **'export-to-excel':** (sites, filename)
    - Quick export current view to Excel
    - Simplified version (no complex formatting)

#### Files to Modify:

**1. `package.json`** (add 1 dependency)
- Add: "exceljs": "^4.4.0"

**2. `electron/main.js`** (add ~5 lines)
- Import reportHandlers
- Register handlers

**3. `electron/preload.js`** (add ~15 lines)
- Expose report IPC methods:
  - generateFullReport: (options) => ipcRenderer.invoke('generate-full-report', options)
  - generatePhaseReport: (phase) => ipcRenderer.invoke('generate-phase-report', phase)
  - generateCustomReport: (filters, columns) => ipcRenderer.invoke('generate-custom-report', filters, columns)
  - exportToExcel: (sites, filename) => ipcRenderer.invoke('export-to-excel', sites, filename)

**4. Frontend: Add Export buttons in UI** (~50 lines across components)
- Location: Sites table toolbar, Dashboard page
- Buttons:
  - "Export All" → generateFullReport
  - "Export Phase" → generatePhaseReport (with phase selector)
  - "Custom Export" → Open modal with filters and column selection
- Show download notification when complete

#### Files to Reference:
- `TSSR_Tracker_Analysis.md` - Original Excel structure (17 sheets, 68 columns)
- Original Excel file formatting

#### Deliverables:
- ✅ Report generator implemented
- ✅ All 17 sheets recreated
- ✅ Original formatting maintained
- ✅ Export buttons in UI
- ✅ Reports downloadable from Desktop app

---

### Day 4: Testing & Bug Fixes

#### Test Files to Create:

**1. `tests/batch-import.test.js`** (~100 lines)
- Test scenarios:
  - Import 1 file successfully
  - Import 10 files successfully
  - Import 50 files (max limit)
  - Import with 1 invalid file (should process valid ones)
  - Import with all invalid files (should fail gracefully)
  - Import duplicate files (should handle conflicts)
- Verify:
  - Database records created
  - WebSocket broadcast sent
  - Activity log recorded
  - Frontend receives success/failure status

**2. `tests/single-import.test.js`** (~100 lines)
- Test scenarios:
  - Import valid Excel file
  - Import invalid file extension
  - Import oversized file
  - Import file with missing columns
  - Import file with invalid data (triggers validation errors)
- Verify:
  - Database record created or error returned
  - Validation errors formatted correctly
  - WebSocket broadcast sent

**3. `tests/realtime-sync.test.js`** (~100 lines)
- Test scenarios:
  - User A edits site → User B sees update
  - User A imports batch → All users see new sites
  - Database updated externally (Supabase) → Desktop app syncs
  - WebSocket disconnect → Reconnect → Catch up on missed updates
- Mock multiple WebSocket clients
- Verify timing: Updates arrive within 5 seconds

**4. `tests/calculations.test.js`** (~100 lines)
- Test scenarios:
  - Action Age calculation with various dates
  - Overall Status calculation with different department combinations
  - Workflow validation (TI must approve before RF Planning, etc.)
  - Auto-progression when department approves
- Verify:
  - Calculated values match expected
  - Workflow rules enforced
  - Invalid status changes rejected

**5. `tests/report-generation.test.js`** (~80 lines)
- Test scenarios:
  - Generate full report (17 sheets)
  - Generate phase report (RO4 only)
  - Generate custom report with filters
  - Verify Excel file structure (sheet names, column count)
- Output:
  - Test reports saved to tests/output/
  - Manual verification of formatting

#### Manual Testing Checklist:

**Database:**
- [ ] Switch from SQLite to Supabase
- [ ] Verify data persists
- [ ] Switch back to SQLite
- [ ] Verify data intact

**Batch Import:**
- [ ] Import 10 Excel files
- [ ] Check progress indicator
- [ ] Verify all 245 sites in database
- [ ] Check for errors
- [ ] Verify WebSocket broadcast

**Single File Import:**
- [ ] Import 1 Excel file
- [ ] Preview data before import
- [ ] Verify database record
- [ ] Check validation errors on invalid file

**Real-time:**
- [ ] Open 2 client instances
- [ ] Edit site in Client 1
- [ ] Verify update appears in Client 2 within 5s
- [ ] Import batch in Client 1
- [ ] Verify new sites appear in Client 2

**Calculations:**
- [ ] Edit department status
- [ ] Verify overall status auto-calculates
- [ ] Verify action age updates
- [ ] Test workflow (try to skip TI approval)

**Reports:**
- [ ] Generate full report
- [ ] Open in Excel and verify 17 sheets
- [ ] Check formatting matches original
- [ ] Generate RO4 phase report
- [ ] Verify only RO4 sites included

#### Bug Tracking:
- Create: `docs/BUGS.md` to track issues found during testing
- Format: Bug description, steps to reproduce, expected vs actual, priority

#### Deliverables:
- ✅ All automated tests passing
- ✅ Manual testing completed
- ✅ Bugs documented and prioritized
- ✅ Critical bugs fixed

---

### Day 5: Documentation & Deployment Preparation

#### Documentation Files to Create:

**1. `docs/IMPORT_GUIDE.md`** (~300 lines)
- Target audience: End users (Admin, Nokia engineers)
- Contents:
  - **Batch Import:**
    - When to use batch import (multiple files)
    - Step-by-step instructions with screenshots
    - File requirements and validation rules
    - How to interpret progress and errors
    - What happens after import (database update, broadcast)
  - **Single File Import:**
    - When to use single file import
    - Step-by-step instructions
    - Preview feature explanation
    - Validation error resolution
  - **Troubleshooting:**
    - Common errors and solutions
    - File format issues
    - Network/connection issues
  - **FAQ:**
    - Can I import while others are using the app? (Yes)
    - What happens to duplicate sites? (Upsert logic)
    - Can I undo an import? (No, but activity log tracks it)

**2. `docs/CUSTOM_PROCESSING.md`** (~200 lines)
- Target audience: Developers (for future customization)
- Contents:
  - **Architecture Overview:**
    - Import flow diagram
    - Processor architecture explanation
  - **Batch Processing Customization:**
    - Location: `electron/services/importProcessors/batchProcessor.js`
    - Function to modify: `applyBatchRules(filesData)`
    - Example custom rule implementations:
      - Validate site_id format
      - Cross-reference with external data source
      - Auto-assign contractor based on governorate
      - Calculate priority based on business rules
    - Testing custom rules
  - **Single File Processing Customization:**
    - Location: `electron/services/importProcessors/singleFileProcessor.js`
    - Function to modify: `applySingleFileRules(fileData)`
    - Example custom rule implementations:
      - Validate against master site list
      - Enrich with additional data
      - Special handling for specific file types
  - **Adding New Import Types:**
    - How to create new processor
    - How to register new IPC handlers
    - How to add UI tab

**3. `docs/DATABASE_SETUP.md`** (~250 lines)
- Target audience: System administrator
- Contents:
  - **SQLite Setup (Default):**
    - No setup required (built-in)
    - Database location: userData/tssr.db
    - Backup strategy
  - **Supabase Setup:**
    - Creating Supabase project
    - Setting up tables schema (SQL scripts provided)
    - Configuring Row Level Security (RLS) policies
    - Generating API keys
    - Environment variables configuration
  - **Migration:**
    - Running migration script
    - Verifying migration
    - Rollback procedures
  - **Switching Databases:**
    - Settings UI instructions
    - When to restart app
    - Data persistence considerations

**4. `docs/DEPLOYMENT.md`** (~200 lines)
- Target audience: System administrator / Developer
- Contents:
  - **Prerequisites:**
    - Node.js version (v18+)
    - npm version (v9+)
    - System requirements
  - **Build Instructions:**
    - Clone repository
    - Install dependencies: `npm install`
    - Configure environment variables
    - Build Electron app: `npm run build`
    - Output location: dist/
  - **Server Mode Deployment:**
    - Running standalone server: `node electron/standaloneServer.js`
    - Systemd service configuration (Linux)
    - PM2 process manager setup
    - Network configuration (ports 3001, 3002)
    - Firewall rules
  - **Client Mode Setup:**
    - Installing client app on user machines
    - Configuring server IP
    - Testing connection
  - **Updates:**
    - Versioning strategy
    - Update distribution
    - Database migration on updates

**5. `docs/API_REFERENCE.md`** (~300 lines)
- Target audience: Developers
- Contents:
  - **IPC API:**
    - All available IPC channels
    - Request/response formats
    - Error codes
  - **Database Adapter API:**
    - BaseAdapter interface
    - SQLiteAdapter methods
    - SupabaseAdapter methods
  - **Import Processors API:**
    - BatchProcessor methods
    - SingleFileProcessor methods
  - **WebSocket Events:**
    - Event types and payloads
    - Client subscription examples

**6. `README.md`** (update existing or create ~150 lines)
- Target audience: Everyone
- Contents:
  - Project overview
  - Features list
  - Quick start guide
  - Links to detailed documentation
  - Support and contact information
  - License information

#### Code Comments:
- Go through all new files and add JSDoc comments
- Especially important for:
  - `applyBatchRules()` - explain placeholder clearly
  - `applySingleFileRules()` - explain placeholder clearly
  - Database adapters - explain when to use each
  - IPC handlers - document parameters and return types

#### Build Script:

**1. Update `package.json`** (modify scripts section)
- Ensure build scripts exist:
  - "build": "electron-builder"
  - "build:win": "electron-builder --win"
  - "build:mac": "electron-builder --mac"
  - "build:linux": "electron-builder --linux"
- Configure electron-builder settings

#### Deliverables:
- ✅ All documentation complete
- ✅ Code comments added
- ✅ Build scripts working
- ✅ README updated
- ✅ Project ready for production use

---

## 📊 Summary: Files Created & Modified

### New Files Created: ~23 files

**Week 1 (Database Layer):**
1. `electron/database/adapters/baseAdapter.js`
2. `electron/database/adapters/sqliteAdapter.js`
3. `electron/database/adapters/supabaseAdapter.js`
4. `electron/scripts/migrate-to-supabase.js`
5. `electron/scripts/verify-migration.js`
6. `tests/database-adapter.test.js`
7. `tests/websocket-broadcast.test.js`

**Week 2 (Import System):**
8. `electron/services/importProcessors/batchProcessor.js`
9. `electron/services/importProcessors/singleFileProcessor.js`
10. `electron/services/importProcessors/importTypes.js`
11. `electron/ipc/importHandlers.js`
12. `src/components/Import/BatchImport.jsx`
13. `src/components/Import/SingleFileImport.jsx`
14. `src/components/Import/ImportPage.jsx`
15. `src/components/Import/ImportPage.css`

**Week 3 (Real-time & Reports):**
16. `electron/services/realtimeSync.js`
17. `electron/services/calculations/autoCalculations.js`
18. `electron/services/calculations/validation.js`
19. `electron/services/calculations/workflow.js`
20. `electron/services/reportGenerator.js`
21. `electron/ipc/reportHandlers.js`
22. `tests/batch-import.test.js`
23. `tests/single-import.test.js`
24. `tests/realtime-sync.test.js`
25. `tests/calculations.test.js`
26. `tests/report-generation.test.js`

**Documentation:**
27. `docs/IMPORT_GUIDE.md`
28. `docs/CUSTOM_PROCESSING.md`
29. `docs/DATABASE_SETUP.md`
30. `docs/DEPLOYMENT.md`
31. `docs/API_REFERENCE.md`
32. `docs/BUGS.md`
33. `.env.example`

### Files Modified: ~12 files

**Week 1:**
1. `electron/database/db.js` - Add adapter pattern
2. `src/pages/Settings/Settings.jsx` - Add database toggle
3. `electron/ipc/settingsHandlers.js` - Add settings IPC (or create if doesn't exist)
4. `package.json` - Add @supabase/supabase-js

**Week 2:**
5. `electron/main.js` - Register import handlers
6. `electron/preload.js` - Expose import IPC methods
7. `src/App.jsx` - Add /import route

**Week 3:**
8. `electron/standaloneServer.js` - Initialize real-time sync
9. `src/context/DataContext.jsx` - Handle new WebSocket events
10. `src/components/EditSiteModal/EditSiteModal.jsx` - Integrate calculations
11. `electron/ipc/dataHandlers.js` - Add calculations to updates
12. `package.json` - Add exceljs

### Total Code Volume Estimate: ~3,100 lines of new code

---

## 🎯 Success Criteria

### Technical:
- ✅ Database adapter pattern working for both SQLite and Supabase
- ✅ 245 RO4 sites successfully migrated to Supabase
- ✅ Batch import processes 10 files in under 30 seconds
- ✅ Single file import works with validation and preview
- ✅ Real-time updates appear in all clients within 5 seconds
- ✅ All auto-calculations produce correct results
- ✅ Excel reports match original format exactly
- ✅ All automated tests passing
- ✅ Zero data loss during imports or database switching

### User Experience:
- ✅ Settings UI allows easy database toggle
- ✅ Import UI is intuitive with clear progress feedback
- ✅ Error messages are helpful and actionable
- ✅ Real-time updates happen without manual refresh
- ✅ System feels responsive (no lag on large datasets)

### Documentation:
- ✅ User guide complete and tested with non-technical user
- ✅ Developer documentation explains custom processing
- ✅ Deployment guide enables independent setup
- ✅ API reference complete for all new interfaces

---

## 🚀 Post-Implementation: Custom Processing Setup

After the 3-week implementation, the user will define:

1. **Batch Processing Rules** in `electron/services/importProcessors/batchProcessor.js`:
   - `applyBatchRules(filesData)` function
   - Custom validation logic
   - Data transformation rules
   - Cross-file reconciliation logic

2. **Single File Processing Rules** in `electron/services/importProcessors/singleFileProcessor.js`:
   - `applySingleFileRules(fileData)` function
   - Different validation from batch
   - Special handling for specific file types
   - Integration with external systems if needed

The implementation leaves these functions as clearly-marked placeholders with TODO comments and detailed documentation on how to customize them.

---

## 📝 Notes for Claude

### When Implementing:

1. **Always check existing files first:**
   - Use Desktop Commander to read files before modifying
   - Understand current structure before adding code
   - Reference examined files listed in this plan

2. **Maintain consistency:**
   - Follow existing code patterns in the project
   - Use same naming conventions
   - Match code style (tabs vs spaces, quotes, etc.)

3. **Test incrementally:**
   - Don't wait until end of week to test
   - Run tests after each file created
   - Fix issues immediately

4. **Preserve existing functionality:**
   - Don't break Server/Client mode
   - Don't break WebSocket system
   - Don't break Excel reading (excelReader.js)
   - Don't break Edit functionality

5. **Placeholder clarity:**
   - Make `applyBatchRules()` and `applySingleFileRules()` very obvious
   - Add TODO comments
   - Include example comment showing what kind of logic might go there
   - Reference CUSTOM_PROCESSING.md documentation

6. **Real-time priority:**
   - Real-time sync is critical - test thoroughly
   - Ensure WebSocket broadcasts work in both SQLite and Supabase modes
   - Verify 3-5 second update latency

7. **Error handling:**
   - Never let import fail silently
   - Always return structured errors
   - Log errors to activity_log table
   - Show user-friendly messages in UI

### File Paths Reference:
All paths are relative to: `C:\Users\aysar\Downloads\New folder (3)\New folder (3)\TSSR Monitor\tssr-app\`

---

**End of Implementation Plan**
