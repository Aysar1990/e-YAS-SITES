# TSSR Monitor - Features Implementation Master Plan

## 📋 Document Information

| Field | Value |
|-------|-------|
| **Project** | TSSR Monitor |
| **Document** | Master Implementation Plan |
| **Version** | 1.1 |
| **Created** | December 27, 2025 |
| **Last Updated** | December 27, 2025 |
| **Total Features** | 10 |
| **Completed** | 1 ✅ |
| **Remaining** | 9 |
| **Estimated Remaining** | 12-15 working days |

---

## 📊 Progress Summary

```
████░░░░░░░░░░░░░░░░ 10% Complete (1/10 Features)
```

| # | Feature | Status | Time Spent | Notes |
|---|---------|--------|------------|-------|
| 1 | Performance Report | ✅ **DONE** | ~7 hours | Completed Dec 27, 2025 |
| 2 | Aging Analysis Tab | 🔲 Pending | - | Next priority |
| 3 | KPIs Dashboard | 🔲 Pending | - | |
| 4 | Workflow Visualization | 🔲 Pending | - | |
| 5 | Activity Feed | 🔲 Pending | - | |
| 6 | Smart Notifications | 🔲 Pending | - | |
| 7 | Interactive Map | 🔲 Pending | - | |
| 8 | Completion Predictions | 🔲 Pending | - | |
| 9 | Quick Actions | 🔲 Pending | - | |
| 10 | Saved Filters & Views | 🔲 Pending | - | |

---

## ✅ COMPLETED FEATURES

### Feature 1: Performance Report ✅

**Completed:** December 27, 2025

**Files Created/Modified:**
| File | Status |
|------|--------|
| `src/pages/Admin/Reports/hooks/usePerformanceData.js` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/index.jsx` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/SubcontractorTable.jsx` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/NokiaTable.jsx` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/ZainTable.jsx` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/PerformanceTab.css` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/TodayStatsCard.jsx` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/OverallProgressCard.jsx` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/PeriodSelector.jsx` | ✅ Updated |
| `src/pages/Admin/Reports/components/PerformanceTab/DrillDownModal.jsx` | ✅ Updated |
| `src/pages/Admin/Reports/utils/performanceExport.js` | ✅ **NEW** |

**Features Implemented:**
- ✅ Accordion layout (click to expand/collapse tables)
- ✅ Today columns with color coding (🟢+7, 🟠3-6, 🔴0-2)
- ✅ Average Days calculation
- ✅ Action Taken for Zain (Approved + Rejected + Released)
- ✅ Released logic fixed (counts for Zain, not Nokia)
- ✅ Full report Excel export (4 sheets)
- ✅ Drill-down modal with search and pagination
- ✅ Period selector (Today/Week/Month/All/Custom)

---

## 🔲 REMAINING FEATURES

### Feature 2: Aging Analysis Tab 🔴 CRITICAL

| Attribute | Value |
|-----------|-------|
| **Location** | Reports Page → New Tab "Aging Analysis" |
| **Priority** | 🔴 Critical |
| **Duration** | 1 day |
| **Dependencies** | Performance Report ✅ (shared hooks) |

#### Specifications

**Configurable Time Brackets:**
```javascript
const DEFAULT_AGING_BRACKETS = [
  { id: 'fresh', label: '< 3 days', min: 0, max: 3, color: '#8FD9D9' },
  { id: 'normal', label: '3-7 days', min: 3, max: 7, color: '#FBBF24' },
  { id: 'warning', label: '7-14 days', min: 7, max: 14, color: '#FF8566' },
  { id: 'critical', label: '> 14 days', min: 14, max: Infinity, color: '#EF4444' },
];
```

**UI Components:**
- Aging Distribution Chart (horizontal bar)
- Aging by Department Table
- Critical Aging List (sites > 14 days)
- Configure Brackets Modal

**File Structure:**
```
src/pages/Admin/Reports/components/
├── AgingTab/
│   ├── index.jsx
│   ├── AgingTab.css
│   ├── AgingDistributionChart.jsx
│   ├── AgingByDepartmentTable.jsx
│   ├── CriticalAgingList.jsx
│   └── ConfigureBracketsModal.jsx
```

---

### Feature 3: KPIs Dashboard 🔴 CRITICAL

| Attribute | Value |
|-----------|-------|
| **Location** | Admin Dashboard (existing page) |
| **Priority** | 🔴 Critical |
| **Duration** | 2 days |
| **Dependencies** | Performance Report ✅ |

**Charts Required:**
| Chart | Type | Library |
|-------|------|---------|
| Phase Completion | Horizontal Bar | Chart.js |
| Status Distribution | Doughnut/Pie | Chart.js |
| Avg Approval Time | Vertical Bar | Chart.js |
| Weekly Trend | Line | Chart.js |
| Subcontractor Ranking | Custom List | - |

**File Structure:**
```
src/pages/Admin/components/
└── KPIs/
    ├── index.js
    ├── KPICard.jsx
    ├── PhaseCompletionChart.jsx
    ├── StatusDistributionChart.jsx
    ├── ApprovalTimeChart.jsx
    ├── WeeklyTrendChart.jsx
    ├── SubcontractorRanking.jsx
    └── KPIs.css
```

---

### Feature 4: Workflow Visualization 🟡 HIGH

| Attribute | Value |
|-----------|-------|
| **Location** | Admin Dashboard |
| **Priority** | 🟡 High |
| **Duration** | 1.5 days |
| **Dependencies** | None |

**Components:**
- WorkflowCompact.jsx (Dashboard version)
- WorkflowExpanded.jsx (Modal full view)
- WorkflowNode.jsx (Clickable node)
- WorkflowConnector.jsx (Arrow/lines)

**Workflow Stages:**
```
Survey → Subcon → Nokia GSD → Nokia NPO → Nokia ROM → Zain → Approved
                                  ↓
                              Rejected → (back to relevant stage)
```

---

### Feature 5: Activity Feed 🟡 HIGH

| Attribute | Value |
|-----------|-------|
| **Location** | Dashboard Sidebar + Dedicated Section |
| **Priority** | 🟡 High |
| **Duration** | 2 days |
| **Dependencies** | WebSocket Infrastructure |

**Activity Types:**
- STATUS_CHANGE
- APPROVED
- REJECTED
- WEEKLY_PLAN
- ALERT
- USER_LOGIN
- DATA_SYNC

**File Structure:**
```
src/components/
└── ActivityFeed/
    ├── index.jsx
    ├── ActivityFeed.css
    ├── ActivityWidget.jsx
    ├── ActivityFull.jsx
    ├── ActivityItem.jsx
    ├── ActivityFilter.jsx
    └── useActivityFeed.js
```

---

### Feature 6: Smart Notifications System 🟡 HIGH

| Attribute | Value |
|-----------|-------|
| **Location** | Header Bell Icon + Desktop Notifications |
| **Priority** | 🟡 High |
| **Duration** | 2.5 days |
| **Dependencies** | WebSocket, Activity Feed |

**Notification Types:**
| Type | Trigger | Sound |
|------|---------|-------|
| Action Age Alert | Site exceeds threshold | ⚠️ Warning |
| Status Change | Site status updated | 🔔 Notification |
| Rejection | Site rejected | 🔴 Alert |
| Weekly Plan | Sites added to plan | 📋 Info |

**File Structure:**
```
src/components/
└── Notifications/
    ├── index.jsx
    ├── NotificationBell.jsx
    ├── NotificationPanel.jsx
    ├── NotificationItem.jsx
    ├── NotificationSettings.jsx
    └── useNotifications.js

src/services/
└── notificationService.js

src/assets/sounds/
├── notification.mp3
├── warning.mp3
└── alert.mp3
```

---

### Feature 7: Interactive Map 🟢 MEDIUM

| Attribute | Value |
|-----------|-------|
| **Location** | Separate Page (Map) |
| **Priority** | 🟢 Medium |
| **Duration** | 2 days |
| **Dependencies** | None |
| **Library** | Leaflet.js + OpenStreetMap |

**Marker Colors by Status:**
```javascript
const MARKER_COLORS = {
  'Approved': '#8FD9D9',
  'TSSR Under Zain validation': '#FBBF24',
  'TSSR Under Nokia NPO Validation': '#60A5FA',
  'Site not surveyed': '#6B7280',
  'Rejected': '#EF4444',
};
```

**File Structure:**
```
src/pages/
└── Map/
    ├── Map.jsx
    ├── Map.css
    ├── components/
    │   ├── MapFilters.jsx
    │   ├── SiteMarker.jsx
    │   ├── SitePopup.jsx
    │   └── MapLegend.jsx
    └── hooks/
        └── useMapData.js
```

---

### Feature 8: Completion Predictions 🟢 MEDIUM

| Attribute | Value |
|-----------|-------|
| **Location** | Dashboard + Reports |
| **Priority** | 🟢 Medium |
| **Duration** | 1 day |
| **Dependencies** | Performance Data |

**Calculations:**
- Weekly rate = Last 7 days approvals
- Estimated completion = Remaining / Weekly rate
- Confidence based on variance

**File Structure:**
```
src/components/
└── Predictions/
    ├── index.jsx
    ├── PhaseCompletionTable.jsx
    ├── WeekForecastCard.jsx
    └── usePredictions.js
```

---

### Feature 9: Quick Actions 🟢 MEDIUM

| Attribute | Value |
|-----------|-------|
| **Location** | Sites Page, Site Details |
| **Priority** | 🟢 Medium |
| **Duration** | 1 day |
| **Dependencies** | None |

**Actions:**
| Action | Roles |
|--------|-------|
| Bulk Status Update | Admin |
| Bulk Assignment | Admin |
| Copy Site Data | All |
| Export Selected | All |
| Add to Weekly Plan | Admin, Nokia |

**File Structure:**
```
src/components/
└── QuickActions/
    ├── index.jsx
    ├── BulkActionsBar.jsx
    ├── StatusUpdateModal.jsx
    ├── AssignmentModal.jsx
    └── useQuickActions.js
```

---

### Feature 10: Saved Filters & Views 🔵 LOW

| Attribute | Value |
|-----------|-------|
| **Location** | Sites Page, Reports Page |
| **Priority** | 🔵 Low |
| **Duration** | 1 day |
| **Dependencies** | None |
| **Storage** | LocalStorage |

**Storage Structure:**
```javascript
// LocalStorage key: tssr_saved_views
{
  "views": [
    {
      "id": "view_1",
      "name": "RO4 Pending in Amman",
      "filters": { "status": "...", "phase": "RO4" },
      "sort": { "field": "site_id", "order": "asc" }
    }
  ]
}
```

**File Structure:**
```
src/components/
└── SavedViews/
    ├── index.jsx
    ├── SaveViewModal.jsx
    ├── LoadViewDropdown.jsx
    └── useSavedViews.js
```

---

## 📅 Updated Implementation Timeline

### Phase 1: Foundation ✅ PARTIALLY COMPLETE
| Day | Feature | Status |
|-----|---------|--------|
| 1-3 | Performance Report | ✅ DONE |
| 4 | Aging Analysis | 🔲 Next |
| 5-6 | KPIs Dashboard | 🔲 Pending |

### Phase 2: Visualization (Days 7-8)
| Day | Feature | Status |
|-----|---------|--------|
| 7 | Workflow Visualization | 🔲 Pending |
| 8 | Completion Predictions | 🔲 Pending |

### Phase 3: Real-time Features (Days 9-12)
| Day | Feature | Status |
|-----|---------|--------|
| 9-10 | Activity Feed | 🔲 Pending |
| 11-12 | Smart Notifications | 🔲 Pending |

### Phase 4: Map & UX (Days 13-15)
| Day | Feature | Status |
|-----|---------|--------|
| 13-14 | Interactive Map | 🔲 Pending |
| 15 | Quick Actions + Saved Views | 🔲 Pending |

---

## 📦 Required Libraries

| Library | Purpose | Install Command |
|---------|---------|-----------------|
| Chart.js | Charts & Graphs | `npm install chart.js react-chartjs-2` |
| Leaflet | Interactive Maps | `npm install leaflet react-leaflet` |
| date-fns | Date Manipulation | `npm install date-fns` |
| howler.js | Sound Effects | `npm install howler` |

---

## 🎯 Next Steps

1. **Immediate:** Test Performance Report feature
2. **Next Feature:** Aging Analysis Tab (1 day)
3. **Then:** KPIs Dashboard (2 days)

---

**Document Version History:**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-27 | Initial creation |
| 1.1 | 2025-12-27 | Performance Report completed, plan updated |

---

*End of Master Implementation Plan*
