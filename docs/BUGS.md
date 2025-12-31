# Known Bugs & Issues

**TSSR Monitor v2.0**
**Last Updated:** December 27, 2025

---

## Critical (Must fix before v2.0)

### None Currently

All critical issues have been addressed.

---

## Medium Priority (Fix in v2.1)

### 1. WebSocket Port Conflict
- **Description:** WebSocket server fails to start if port 3002 is in use
- **Steps to reproduce:**
  1. Start the app twice
  2. Second instance fails with "Port 3002 is already in use"
- **Expected:** Should detect existing instance or use alternate port
- **Current workaround:** Close previous instance before starting new one
- **Severity:** Medium
- **Component:** `electron/server/websocketServer.js`

### 2. Workflow Validation Precedence
- **Description:** When validating status change, the "previous department" check runs before the "all previous departments" loop
- **Impact:** Error messages may reference immediate previous department instead of first blocked department
- **Example:** When approving `civil` with only `ti: Pending`, error says "RF Optimization must be approved" instead of "TI must be approved"
- **Component:** `electron/services/calculations/workflow.js:163-173`
- **Severity:** Low (cosmetic - workflow still correctly blocks)

### 3. Supabase Connection Retry
- **Description:** Supabase real-time subscription only retries once on error
- **Expected:** Should implement exponential backoff
- **Current workaround:** Manual reconnect via settings
- **Component:** `electron/services/realtimeSync.js:204-223`

---

## Low Priority (Future consideration)

### 1. Large Dataset Performance
- **Description:** Loading 10,000+ sites may cause slight UI delay
- **Workaround:** Virtualization is implemented for cards/tables
- **Potential fix:** Add pagination API for server mode

### 2. Export Progress Indicator
- **Description:** Large Excel exports (5000+ rows) show no progress
- **Expected:** Progress bar during export
- **Current behavior:** "Exporting..." text only

### 3. Offline Mode Sync Queue
- **Description:** No offline queue for changes when disconnected
- **Expected:** Queue changes and sync when reconnected
- **Current behavior:** Changes fail silently in offline mode

### 4. Date Timezone Handling
- **Description:** Action age calculation uses local timezone
- **Impact:** May show different ages for same date in different timezones
- **Component:** `electron/services/calculations/autoCalculations.js`

### 5. Memory Usage on Long Sessions
- **Description:** Memory usage grows over time with many edits
- **Workaround:** Restart app after heavy use
- **Potential fix:** Implement garbage collection for undo history

---

## Fixed

### [v2.0.0] Day 13 - SitesToolbar Export Props
- **Issue:** Export dropdown menu not working
- **Cause:** Missing props `onExportFull`, `onExportPhase`, `onExportFiltered` in Sites.jsx
- **Fixed in:** `src/pages/Admin/Sites.jsx:502-524`
- **Commit:** Day 13 completion

### [v2.0.0] Day 12 - Workflow Auto-Progress
- **Issue:** Next department not set to Pending after approval
- **Fixed in:** `electron/services/calculations/workflow.js`
- **Commit:** Day 12 completion

### [v2.0.0] Day 11 - SQLite Polling Duplicates
- **Issue:** Same change broadcasted multiple times
- **Fixed in:** `electron/services/realtimeSync.js` - Added change tracking
- **Commit:** Day 11 completion

### [v2.0.0] Day 10 - Import Batch Size
- **Issue:** 50+ file imports caused memory issues
- **Fixed in:** `electron/services/batchProcessor.js` - Added chunking
- **Commit:** Day 10 completion

---

## Test Coverage

| Component | Tests | Passing | Coverage |
|-----------|-------|---------|----------|
| Database Adapters | 31 | 31 | ~85% |
| WebSocket Broadcast | 16 | 7 | ~60%* |
| Batch Processor | 27 | 27 | ~80% |
| Import IPC | 18 | 18 | ~75% |
| Real-time Sync | 18 | 18 | ~80% |
| Calculations | 39 | 39 | ~90% |
| Report Generation | 31 | 31 | ~85% |
| Integration | 22 | 22 | ~70% |

*WebSocket tests require exclusive port access

---

## How to Report Bugs

1. Check if the issue exists in this document
2. If new, create a GitHub issue with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Environment (OS, Electron version)

---

## Debugging Tools

### Enable Debug Logging
```javascript
// In main.js or preload.js
localStorage.setItem('TSSR_DEBUG', 'true')
```

### Check Database State
```javascript
// In DevTools console
window.electron.getStats()
```

### Force Sync
```javascript
window.electron.triggerSync()
```

---

**Last automated test run:** December 27, 2025
**Total tests:** 202
**Passing:** 193
**Failing:** 9 (port conflict related)
