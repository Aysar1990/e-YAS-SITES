# Batch Operations Integration Guide

## Step 1: Update Imports in Sites.jsx

Replace the imports section with:

```javascript
import {
  useSitesData,
  useSitesFilters,
  usePagination,
  useAdvancedSearch,
  useBatchOperations, // NEW
  mapLocalToFirebase,
  SitesTable,
  FlipCard,
  SitesToolbar,
  BulkUpdateModal,
  BulkDeleteModal, // NEW
  BulkAssignModal, // NEW
  BatchProgress, // NEW
  Pagination,
  AdvancedSearchBar,
  QuickFilters,
  VirtualizedCardGrid,
  VirtualizedTable,
  LazyLoadingToggle,
  BulkActionsBar // Will use enhanced version
} from '../../components/Sites'
```

## Step 2: Add Batch Operations Hook

After the `useAdvancedSearch` hook, add:

```javascript
// Batch Operations hook
const {
  isProcessing,
  progress,
  results,
  batchUpdate,
  batchDelete,
  batchStatusUpdate,
  batchAssignContractor,
  batchPriorityUpdate,
  reset
} = useBatchOperations(handleSaveSite)
```

## Step 3: Add Modal States

After existing modal states, add:

```javascript
// Batch modal states
const [deleteModalOpen, setDeleteModalOpen] = useState(false)
const [assignModalOpen, setAssignModalOpen] = useState(false)
const [assignType, setAssignType] = useState('contractor') // contractor, priority, status
```

## Step 4: Get Available Options from Sites

Add this before the handlers section:

```javascript
// Get unique contractors from sites
const uniqueContractors = [...new Set(
  sites
    .map(s => s.tssr_subcon)
    .filter(Boolean)
)].sort()

// Priority options (from your data)
const priorityOptions = ['P1', 'P2', 'P3', 'P4']
```

## Step 5: Update Handlers

Replace existing handlers with enhanced versions:

```javascript
// Enhanced Bulk Update Handler
const handleBulkUpdate = async (newStatus) => {
  if (!useFirebase || !firebaseConnected) {
    alert('Bulk update requires Firebase connection')
    return
  }

  const siteIds = Array.from(selectedSites)
  await batchStatusUpdate(siteIds, newStatus)
  
  if (results.success.length > 0) {
    alert(`Successfully updated ${results.success.length} sites`)
  }
  if (results.failed.length > 0) {
    alert(`Failed to update ${results.failed.length} sites`)
  }
  
  handleClearSelection()
  setBulkModalOpen(false)
}

// Bulk Delete Handler
const handleBulkDelete = async () => {
  if (!useFirebase || !firebaseConnected) {
    alert('Bulk delete requires Firebase connection')
    return
  }

  const siteIds = Array.from(selectedSites)
  await batchDelete(siteIds)
  
  if (results.success.length > 0) {
    alert(`Successfully deleted ${results.success.length} sites`)
  }
  if (results.failed.length > 0) {
    alert(`Failed to delete ${results.failed.length} sites`)
  }
  
  handleClearSelection()
}

// Bulk Assign Handler
const handleBulkAssign = async (value, type) => {
  if (!useFirebase || !firebaseConnected) {
    alert('Bulk assignment requires Firebase connection')
    return
  }

  const siteIds = Array.from(selectedSites)
  
  let operation
  switch(type) {
    case 'contractor':
      operation = batchAssignContractor(siteIds, value)
      break
    case 'priority':
      operation = batchPriorityUpdate(siteIds, value)
      break
    case 'status':
      operation = batchStatusUpdate(siteIds, value)
      break
    default:
      operation = batchUpdate(siteIds, { [type]: value })
  }
  
  await operation
  
  if (results.success.length > 0) {
    alert(`Successfully updated ${results.success.length} sites`)
  }
  if (results.failed.length > 0) {
    alert(`Failed to update ${results.failed.length} sites`)
  }
  
  handleClearSelection()
}

// Export Selected Sites
const handleExportSelected = async () => {
  if (!canEdit) {
    alert('Only Admin users can export data')
    return
  }
  if (!useFirebase || !firebaseConnected) {
    alert('Please enable Firebase mode to export data')
    return
  }
  
  const selectedSitesList = sites.filter(s => selectedSites.has(s.site_id))
  
  if (selectedSitesList.length === 0) {
    alert('No sites selected for export')
    return
  }
  
  setExporting(true)
  try {
    const result = await exportToExcelDownload(
      selectedSitesList,
      `${activePhase}_selected`,
      () => {}
    )
    if (result.success) {
      alert(`Exported ${result.sitesCount} selected sites to ${result.filename}`)
    } else {
      alert(`Export failed: ${result.error}`)
    }
  } catch (error) {
    alert(`Export error: ${error.message}`)
  }
  setExporting(false)
}
```

## Step 6: Replace BulkActionsBar

Replace the old bulk actions bar with the new enhanced version:

```javascript
{/* BULK ACTIONS BAR - ENHANCED */}
{selectedSites.size > 0 && (
  <BulkActionsBar
    selectedCount={selectedSites.size}
    onClear={handleClearSelection}
    onUpdateStatus={() => setBulkModalOpen(true)}
    onAssignContractor={() => {
      setAssignType('contractor')
      setAssignModalOpen(true)
    }}
    onUpdatePriority={() => {
      setAssignType('priority')
      setAssignModalOpen(true)
    }}
    onDelete={() => setDeleteModalOpen(true)}
    onExport={handleExportSelected}
  />
)}
```

## Step 7: Add New Modals

Add these modals after the existing BulkUpdateModal:

```javascript
{/* BATCH OPERATIONS MODALS */}
<BulkDeleteModal
  isOpen={deleteModalOpen}
  onClose={() => setDeleteModalOpen(false)}
  onConfirm={handleBulkDelete}
  selectedCount={selectedSites.size}
  selectedSites={sites.filter(s => selectedSites.has(s.site_id))}
/>

<BulkAssignModal
  isOpen={assignModalOpen}
  onClose={() => setAssignModalOpen(false)}
  onConfirm={handleBulkAssign}
  selectedCount={selectedSites.size}
  assignType={assignType}
  availableOptions={
    assignType === 'contractor' ? uniqueContractors :
    assignType === 'priority' ? priorityOptions :
    assignType === 'status' ? uniqueStatuses :
    []
  }
/>

{/* BATCH PROGRESS */}
<BatchProgress
  isProcessing={isProcessing}
  current={progress.current}
  total={progress.total}
  operation={
    isProcessing ? 'Processing batch operation...' : 
    results.success.length > 0 ? 'Batch operation complete' : 
    ''
  }
  onCancel={reset}
/>
```

## Complete! 🎉

Your Batch Operations are now fully integrated! Users can:

- ✅ Select multiple sites
- ✅ Update status in bulk
- ✅ Assign contractors in bulk
- ✅ Update priorities in bulk
- ✅ Delete sites in bulk (with safety confirmation)
- ✅ Export selected sites
- ✅ See real-time progress
- ✅ View success/failure results

## Testing Checklist

1. [ ] Select 5-10 sites
2. [ ] Try bulk status update
3. [ ] Try bulk contractor assignment
4. [ ] Try bulk priority update
5. [ ] Try export selected
6. [ ] Try delete (should show warning)
7. [ ] Check progress bar shows correctly
8. [ ] Verify success/failure counts
