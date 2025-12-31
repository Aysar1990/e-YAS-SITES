# Day 5 - Manual Testing Checklist

## Pre-requisites
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] Database file exists at `data/tssr.db`

---

## 1. SQLite Database Testing

### Launch Application with SQLite (Default)
```bash
npm run electron:dev
# OR
npm start
```

- [ ] App launches without errors
- [ ] Console shows: "SQLite database loaded from: data/tssr.db"
- [ ] Migrations run successfully (check console)

### Insert Test Site
- [ ] Navigate to Sites page
- [ ] Add a new site with test data:
  - Site ID: TEST-001
  - Site Name: Manual Test Site
  - Region: AMN
  - Status: Active
- [ ] Site appears in the sites list
- [ ] Refresh page - site persists

---

## 2. Database Adapter Switching (Supabase)

### Configure Supabase (if credentials available)
1. Create `.env` file in project root:
```
DATABASE_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Switch to Supabase in Settings
- [ ] Open Admin Settings > Database Settings
- [ ] Change database type to Supabase
- [ ] Enter Supabase URL and API key
- [ ] Click Save
- [ ] Restart application
- [ ] Console shows: "Supabase connection established"

### Verify Data Persistence After Switch
- [ ] Previous test site (TEST-001) appears after restart
- [ ] Insert new site: TEST-002
- [ ] Both sites visible
- [ ] Data persists after restart

---

## 3. Multi-Client Real-Time Updates (WebSocket)

### Open Two Application Instances
```bash
# Terminal 1: Start server
npm run server

# Terminal 2: Start first app instance
npm run electron:dev

# Terminal 3: Start second app instance (different port)
PORT=3001 npm run electron:dev
```

### Test Real-Time Sync
- [ ] Both clients connect to WebSocket server
- [ ] Console shows: "[WebSocket] Authenticated" for each client

### Edit Site in Client 1
- [ ] Edit TEST-001 site in Client 1
- [ ] Change status from Active to Pending
- [ ] Save changes

### Verify Update in Client 2
- [ ] Within 5 seconds, Client 2 shows updated status
- [ ] No manual refresh required
- [ ] Both clients show same data

### Test Insert Propagation
- [ ] Insert new site TEST-003 in Client 2
- [ ] Client 1 automatically shows new site

### Test Delete Propagation
- [ ] Delete TEST-003 in Client 1
- [ ] Client 2 automatically removes site

---

## 4. Error Handling Verification

### Database Connection Errors
- [ ] Stop the server and try to insert a site
- [ ] Error message appears (not crash)
- [ ] App remains responsive

### WebSocket Disconnection
- [ ] Disconnect from network briefly
- [ ] Reconnect
- [ ] Client reconnects automatically
- [ ] Data sync resumes

---

## 5. Performance Checks

### Large Data Set
- [ ] Load 1000+ sites
- [ ] Query time < 500ms
- [ ] UI remains responsive

### Transaction Integrity
- [ ] Start bulk insert (10+ sites)
- [ ] Interrupt halfway (close app)
- [ ] Restart app
- [ ] Database is not corrupted
- [ ] Partial insert was rolled back

---

## Test Results Summary

| Test Category | Pass | Fail | Notes |
|--------------|------|------|-------|
| SQLite Database | | | |
| Supabase Switch | | | |
| WebSocket Sync | | | |
| Error Handling | | | |
| Performance | | | |

**Tested By:** _______________

**Date:** _______________

**Overall Result:** [ ] PASS / [ ] FAIL

---

## Issues Found

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
