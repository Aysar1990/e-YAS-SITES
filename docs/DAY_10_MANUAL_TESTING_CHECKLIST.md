# Day 10: Manual Testing Checklist
## Week 2 Import System Integration Testing

**Date**: 2025-12-27
**Component**: Import System (Days 6-10)
**Tester**: _____________

---

## Prerequisites

- [ ] Electron app is running (`npm start`)
- [ ] Database is initialized
- [ ] Test Excel files prepared (.xlsx, .xlsm, .xls)
- [ ] Invalid test files prepared (.pdf, .txt, oversized files)

---

## 1. Navigation & UI Tests

### Access Import Page
- [ ] Navigate to Admin Dashboard
- [ ] Click "Import" menu item
- [ ] Verify Import page loads with two tabs:
  - [ ] "Single File Import" tab
  - [ ] "Batch Import" tab
- [ ] Verify YAS branding colors (turquoise #8FD9D9, orange #FF8566)
- [ ] Verify glassmorphism styling

---

## 2. Single File Import Tests

### File Selection
- [ ] Click "Browse Files" or drag & drop area
- [ ] Select a valid .xlsx file
- [ ] Verify file appears in upload area with:
  - [ ] File name
  - [ ] File size
  - [ ] File type icon
  - [ ] Remove button (X)

### File Validation
- [ ] Try uploading .pdf file → Should reject with error
- [ ] Try uploading .txt file → Should reject with error
- [ ] Try uploading 11MB+ file → Should reject "File too large"
- [ ] Upload valid .xlsx file → Should accept
- [ ] Upload valid .xlsm file → Should accept
- [ ] Upload valid .xls file → Should accept

### Preview Functionality
- [ ] Upload valid Excel file
- [ ] Click "Preview" button
- [ ] Verify preview modal shows:
  - [ ] First 10-20 rows of data
  - [ ] Column headers
  - [ ] Site IDs
  - [ ] Site names
- [ ] Close preview modal

### Import Process
- [ ] Upload valid Excel file with test data
- [ ] Click "Import File" button
- [ ] Verify progress indicator appears
- [ ] Verify progress updates in real-time:
  - [ ] Percentage (0-100%)
  - [ ] Records processed count
  - [ ] Current status message
- [ ] Verify import completes successfully
- [ ] Verify success message shows:
  - [ ] Total records
  - [ ] Inserted count
  - [ ] Updated count
  - [ ] Skipped count
  - [ ] Failed count

### Database Verification
- [ ] After import, navigate to Sites page
- [ ] Verify imported sites appear in the list
- [ ] Verify site data is correct (Site ID, Name, Status)
- [ ] Check if updates work (re-import same file with changes)

### Error Handling
- [ ] Upload Excel file with invalid data (missing Site ID)
- [ ] Verify error message displays
- [ ] Verify failed records are listed
- [ ] Verify partial import completes (valid records imported)

---

## 3. Batch Import Tests

### Multiple File Selection
- [ ] Switch to "Batch Import" tab
- [ ] Click "Browse Files" or drag & drop area
- [ ] Select multiple Excel files (3-5 files)
- [ ] Verify all files appear in the list with:
  - [ ] File names
  - [ ] File sizes
  - [ ] Status badges
  - [ ] Remove buttons

### Batch Validation
- [ ] Add mix of valid and invalid files
- [ ] Click "Validate All" button
- [ ] Verify validation runs for all files
- [ ] Verify status indicators:
  - [ ] Green checkmark for valid files
  - [ ] Red X for invalid files
- [ ] Verify invalid files show error messages

### Batch Import Process
- [ ] Select 3-5 valid Excel files
- [ ] Click "Import All Files" button
- [ ] Verify batch progress indicator:
  - [ ] Overall progress (X of Y files)
  - [ ] Current file being processed
  - [ ] Per-file progress bars
- [ ] Verify each file processes sequentially
- [ ] Verify batch completes successfully
- [ ] Verify summary shows:
  - [ ] Total files processed
  - [ ] Total records inserted
  - [ ] Total records updated
  - [ ] Any errors

### File Management
- [ ] Add 5 files to batch
- [ ] Remove 2 files using X button
- [ ] Verify removed files disappear
- [ ] Add files back
- [ ] Click "Clear All" button
- [ ] Verify all files removed

### Error Recovery
- [ ] Add batch with 1 invalid file
- [ ] Start batch import
- [ ] Verify invalid file fails gracefully
- [ ] Verify other files continue processing
- [ ] Verify final summary shows failures

---

## 4. Real-time Updates Tests

### WebSocket Broadcasting
- [ ] Open app in two browser windows/instances
- [ ] In Window 1: Import a file
- [ ] In Window 2: Navigate to Sites page
- [ ] Verify Window 2 receives real-time updates:
  - [ ] New sites appear automatically
  - [ ] No manual refresh needed
  - [ ] Notification badge updates

### Progress Broadcasting
- [ ] Start import in one window
- [ ] Verify progress events broadcast correctly
- [ ] Check browser console for WebSocket messages

---

## 5. Data Transformation Tests

### Field Mapping
- [ ] Import Excel file with all columns
- [ ] Verify camelCase → snake_case conversion:
  - [ ] `siteId` → `site_id`
  - [ ] `finalSiteName` → `final_site_name`
  - [ ] `tssrOverallStatus` → `tssr_overall_status`
- [ ] Check database directly (if possible)

### Data Types
- [ ] Import file with numeric fields (priority, coordinates)
- [ ] Verify numbers stored correctly
- [ ] Import file with date fields
- [ ] Verify dates formatted correctly
- [ ] Import file with null/empty values
- [ ] Verify nulls handled properly

---

## 6. Performance Tests

### Large File Import
- [ ] Import file with 1000+ records
- [ ] Verify progress updates smoothly
- [ ] Verify no UI freezing
- [ ] Verify import completes in reasonable time
- [ ] Check memory usage (shouldn't spike excessively)

### Batch of Large Files
- [ ] Import batch of 5 files, each 500+ records
- [ ] Verify sequential processing
- [ ] Verify no crashes
- [ ] Verify all files complete

---

## 7. IPC Communication Tests

### Validation IPC
- [ ] Upload file and trigger validation
- [ ] Open DevTools → Console
- [ ] Verify `validate-single` IPC call succeeds
- [ ] Verify response has correct structure

### Import IPC
- [ ] Start import
- [ ] Verify `import-single` IPC call in console
- [ ] Verify progress events (`import-progress`)
- [ ] Verify completion event

---

## 8. Edge Cases & Stress Tests

### Unusual Files
- [ ] Empty Excel file → Should reject
- [ ] Excel file with no data rows → Should handle gracefully
- [ ] Excel file with malformed headers → Should detect/warn
- [ ] Corrupted Excel file → Should error gracefully

### Rapid Operations
- [ ] Start import, immediately cancel (if cancel exists)
- [ ] Start multiple imports rapidly
- [ ] Verify queue/locking prevents conflicts

### Browser Compatibility
- [ ] Test in Electron (main target)
- [ ] Test in Chrome browser (fallback mode)
- [ ] Verify mock fallback works when IPC unavailable

---

## 9. Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators visible
- [ ] Press Enter/Space on buttons
- [ ] Verify keyboard shortcuts work (if any)

### Screen Reader Support
- [ ] Enable screen reader
- [ ] Navigate import page
- [ ] Verify labels are announced
- [ ] Verify status updates are announced

---

## 10. Final Verification

### Week 2 Deliverables Check
- [ ] Single file import works end-to-end
- [ ] Batch import works end-to-end
- [ ] Validation works correctly
- [ ] Progress tracking works
- [ ] Database updates work
- [ ] WebSocket broadcasting works
- [ ] Error handling is robust
- [ ] UI is polished and branded

### Code Quality
- [ ] No console errors in browser
- [ ] No console errors in Electron main process
- [ ] All automated tests pass (`npm test`)
- [ ] Import-specific tests pass (`npm run test:import`)

---

## Issues Found

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 |             | High/Med/Low | Open/Fixed |
| 2 |             | High/Med/Low | Open/Fixed |
| 3 |             | High/Med/Low | Open/Fixed |

---

## Sign-off

**Tester**: _____________
**Date**: _____________
**Status**: ☐ Passed  ☐ Passed with Issues  ☐ Failed

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

## Automated Test Results

```bash
npm run test:import
```

**Batch Import Tests**: ☐ 23/23 passed
**Single Import Tests**: ☐ 18/18 passed
**IPC Handler Tests**: ☐ 12/12 passed

**Total**: ☐ 53/53 tests passed
