# Phase 1: Analysis Report
## TSSR Monitor App - Code Refactoring Analysis
### Date: 2025-12-28

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| Total Source Files | 342 |
| Files > 300 lines | **71** |
| Total Components (.jsx) | 142 |
| Total Lines in Large Files | ~32,000+ |
| Estimated Duplicate Code | ~25-30% |

---

## 2. Files > 300 Lines (Priority Order)

### 2.1 CRITICAL (> 700 lines) - Must Split

| # | File | Lines | Type | Priority |
|---|------|-------|------|----------|
| 1 | SpreadsheetView.jsx | **1,116** | Component | CRITICAL |
| 2 | SpreadsheetView.css | **990** | Styles | HIGH |
| 3 | Sites.jsx | **855** | Component | CRITICAL |
| 4 | ImportPage.css | **848** | Styles | HIGH |
| 5 | Sites.css | **789** | Styles | HIGH |
| 6 | AdminDashboard.jsx | **737** | Component | CRITICAL |
| 7 | PerformanceTab.css | **736** | Styles | HIGH |
| 8 | MapView.css | **730** | Styles | MEDIUM |
| 9 | EditSiteModal.css | **710** | Styles | MEDIUM |

### 2.2 HIGH (500-700 lines)

| # | File | Lines | Type |
|---|------|-------|------|
| 10 | NokiaSites.css | 688 | Styles |
| 11 | mockData.js | 686 | Service |
| 12 | FormattingRules.css | 676 | Styles |
| 13 | Import.css | 674 | Styles |
| 14 | NokiaDashboard.jsx | 670 | Component |
| 15 | Contractors.css | 630 | Styles |
| 16 | global.css | 620 | Styles |
| 17 | Settings/index.jsx | 599 | Component |
| 18 | ContractorSites.css | 593 | Styles |
| 19 | ManagementReports.jsx | 570 | Component |
| 20 | apiClient.js | 565 | Service |
| 21 | ModeSelection.css | 562 | Styles |
| 22 | ContractorDashboard.css | 556 | Styles |
| 23 | Ghirbal.css | 547 | Styles |
| 24 | EditSiteModal.jsx | 524 | Component |
| 25 | FormattingRules.jsx | 521 | Component |

### 2.3 MEDIUM (400-500 lines)

| # | File | Lines | Type |
|---|------|-------|------|
| 26 | ContractorRejections.css | 519 | Styles |
| 27 | dashboard-cards.css | 512 | Styles |
| 28 | SuggestionsPanel.css | 500 | Styles |
| 29 | TransformImport.css | 498 | Styles |
| 30 | DataContext.jsx | 485 | Context |
| 31 | AdvancedFilter.css | 482 | Styles |
| 32 | Comments.css | 480 | Styles |
| 33 | useFirebaseData.js | 467 | Hook |
| 34 | BatchImport.jsx | 464 | Component |
| 35 | firebaseService.js | 452 | Service |
| 36 | AdvancedCharts.css | 449 | Styles |
| 37 | dashboard-overview.css | 447 | Styles |
| 38 | usePerformanceData.js | 446 | Hook |
| 39 | dashboard-base.css | 445 | Styles |
| 40 | Ghirbal.jsx | 444 | Component |
| 41 | settings/base.css | 442 | Styles |
| 42 | ImportModal.jsx | 435 | Component |
| 43 | ActivityFeed.css | 433 | Styles |
| 44 | formattingRules.js | 432 | Utility |
| 45 | useSmartSuggestions.js | 425 | Hook |
| 46 | NokiaReports.jsx | 424 | Component |
| 47 | UserPresence.css | 421 | Styles |
| 48 | ContractorSites.jsx | 408 | Component |
| 49 | TransformImport.jsx | 400 | Component |
| 50 | performanceExport.js | 400 | Utility |

### 2.4 LOW (300-400 lines) - 21 files

```
MapView.jsx (396), ContractorDashboard.jsx (395), Contractors.jsx (394),
ExportDialog.css (391), dashboard-charts.css (390), calculations/index.js (387),
ViewsManager.css (386), routes/index.jsx (385), BulkEditModal.css (375),
ClearTSSR.css (360), FilterBuilder.jsx (358), AdvancedSearchBar.css (358),
dashboard-animations.css (354), Rejections.css (336), dashboard-responsive.css (335),
validation.js (332), SitesToolbar.css (332), ManagementSites.css (330),
CellHistoryPanel.css (329), SingleFileImport.jsx (329), FirebaseSettings.jsx (325),
ManagementSites.jsx (322), FlipCard.css (322), Card.css (314), variables.css (313),
status-styles.css (313), database.css (312), BulkDeleteModal.css (304)
```

---

## 3. Code Duplication Analysis

### 3.1 JavaScript/React Patterns

| Pattern | Occurrences | Files Affected | Savings Potential |
|---------|-------------|----------------|-------------------|
| `const [loading, setLoading] = useState` | 16 | 16 | ~80 lines |
| `const [error, setError] = useState` | 15 | 15 | ~75 lines |
| `toLocaleDateString()` | 13 | 13 | ~40 lines |
| `localStorage.getItem/setItem` | 68 | ~20 | ~200 lines |
| `try { } catch { }` blocks | 185 | ~50 | ~500 lines |
| `console.log/error` | 186 | ~60 | (cleanup) |

### 3.2 CSS Patterns

| Pattern | Occurrences | Savings Potential |
|---------|-------------|-------------------|
| `rgba(143, 217, 217, ...)` (YAS Primary) | **532** | Use CSS variable |
| `border-radius: 8px/12px/16px` | **306** | Use CSS mixin |
| `transition: all 0.2s/0.3s` | **243** | Use CSS variable |
| `box-shadow: 0...` | **237** | Use CSS mixin |
| `background: #141e30/#0a0e1a` | 27 | Use CSS variable |

### 3.3 Component Patterns

| Pattern | Occurrences | Recommendation |
|---------|-------------|----------------|
| Loading Spinner | 21 files | Create `<LoadingSpinner />` |
| Error Message Display | 9 files | Create `<ErrorMessage />` |
| Confirmation Dialogs | ~8 files | Create `<ConfirmDialog />` |

---

## 4. Top 5 Files Detailed Analysis

### 4.1 SpreadsheetView.jsx (1,116 lines)

**Current Structure:**
- State variables: **30**
- Event handlers: **18**
- Imports: ~35

**Responsibilities (Too Many!):**
1. Grid data management
2. Toolbar controls
3. Column management
4. Export functionality
5. Modal management (6+ modals)
6. Filtering logic
7. Phase 5: Activity Feed, Comments, Presence
8. Phase 6: Bulk Edit, Import, Advanced Filter

**Proposed Split:**
```
SpreadsheetView/
├── SpreadsheetView.jsx (200 lines) - Orchestrator
├── components/
│   ├── Toolbar/
│   │   └── SpreadsheetToolbar.jsx (150 lines)
│   ├── Grid/
│   │   ├── GridWrapper.jsx (100 lines)
│   │   └── columnDefs.js (existing)
│   └── ColumnManager/
│       └── ColumnManager.jsx (120 lines)
├── hooks/
│   ├── useSpreadsheetData.js (150 lines)
│   ├── useSpreadsheetActions.js (100 lines)
│   └── useModals.js (80 lines)
└── modals/ (existing structure OK)
```

**Estimated Savings:** 916 lines (82%)

---

### 4.2 Sites.jsx (855 lines)

**Current Structure:**
- State variables: **11**
- Event handlers: **16**
- Multiple view modes (Table, Cards, Map)

**Proposed Split:**
```
Sites/
├── Sites.jsx (150 lines) - Container
├── components/
│   ├── SitesHeader.jsx (100 lines)
│   ├── SitesContent.jsx (150 lines) - View switcher
│   └── SitesFilters.jsx (100 lines)
└── hooks/
    └── useSitesState.js (150 lines)
```

**Note:** Already has good component extraction in `components/Sites/`

**Estimated Savings:** 650 lines (76%)

---

### 4.3 AdminDashboard.jsx (737 lines)

**Current Structure:**
- State variables: **4**
- Multiple dashboard sections

**Proposed Split:**
```
AdminDashboard/
├── AdminDashboard.jsx (150 lines)
├── components/
│   ├── DashboardHeader.jsx (80 lines)
│   ├── DashboardStats.jsx (100 lines)
│   ├── DashboardCharts.jsx (150 lines)
│   └── DashboardTables.jsx (150 lines)
└── hooks/
    └── useDashboardData.js (100 lines)
```

**Note:** Already has `hooks/useDashboardKPIs.js` - good pattern

**Estimated Savings:** 537 lines (73%)

---

## 5. Shared Code Extraction Plan

### 5.1 Create `/src/hooks/shared/`

```javascript
// useApiRequest.js - Replace 15+ duplicate patterns
export const useApiRequest = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // ... unified API logic
};

// useLocalStorage.js - Replace 68 localStorage calls
export const useLocalStorage = (key, initialValue) => {
  // ... unified localStorage logic
};

// useAsyncState.js - Replace loading/error pattern
export const useAsyncState = (asyncFn) => {
  // ... unified async state management
};
```

### 5.2 Create `/src/components/shared/`

```javascript
// LoadingSpinner.jsx - Replace 21 duplicates
// ErrorMessage.jsx - Replace 9 duplicates
// ConfirmDialog.jsx - Reusable confirmation
// EmptyState.jsx - "No data" displays
```

### 5.3 Create `/src/styles/shared/`

```css
/* variables.css - Already exists, enhance */
:root {
  --yas-primary: #8FD9D9;
  --yas-primary-10: rgba(143, 217, 217, 0.1);
  --yas-primary-20: rgba(143, 217, 217, 0.2);
  /* ... more opacity variants */

  --transition-fast: all 0.2s ease;
  --transition-normal: all 0.3s ease;

  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.2);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

/* mixins.css - Reusable patterns */
.card-base { /* common card styles */ }
.btn-base { /* common button styles */ }
.flex-center { display: flex; align-items: center; justify-content: center; }
```

---

## 6. CSS Files Consolidation Strategy

### Current Problem:
- 71 files > 300 lines
- **38 are CSS files**
- Massive duplication of colors, transitions, shadows

### Solution: CSS Architecture

```
src/styles/
├── variables.css (enhance existing)
├── mixins.css (NEW)
├── base.css (NEW - common patterns)
├── components/ (component-specific)
└── pages/ (page-specific, import base)
```

### Quick Win: Replace Hard-coded Colors

```css
/* Before (532 occurrences) */
rgba(143, 217, 217, 0.1)
rgba(143, 217, 217, 0.2)
rgba(143, 217, 217, 0.3)

/* After (use variables) */
var(--yas-primary-10)
var(--yas-primary-20)
var(--yas-primary-30)
```

---

## 7. Risk Assessment

### Low Risk Refactoring (Start Here)
1. Extract CSS variables (won't break functionality)
2. Create shared hooks (can be done incrementally)
3. Extract small components (isolated changes)

### Medium Risk Refactoring
1. Split large components (need thorough testing)
2. Consolidate CSS files (may affect specificity)

### High Risk Refactoring
1. Restructure SpreadsheetView (1,116 lines, many dependencies)
2. Modify DataContext (affects entire app)
3. Change services (API calls throughout app)

---

## 8. Recommended Execution Order

### Week 1: Foundation
1. **Day 1-2:** Enhance CSS variables, create mixins
2. **Day 3-4:** Create shared hooks (useApiRequest, useLocalStorage)
3. **Day 5:** Create shared components (LoadingSpinner, ErrorMessage)

### Week 2: Component Splits
1. **Day 6-7:** Split AdminDashboard.jsx (easiest of the big 3)
2. **Day 8-9:** Split Sites.jsx (already partially done)
3. **Day 10:** Begin SpreadsheetView.jsx planning

### Week 3: SpreadsheetView + CSS
1. **Day 11-13:** Split SpreadsheetView.jsx (largest, most complex)
2. **Day 14-15:** Consolidate CSS files

---

## 9. Metrics Goals

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Files > 300 lines | 71 | < 25 | -65% |
| Largest file | 1,116 | < 300 | -73% |
| CSS duplication | ~1,500+ | < 200 | -87% |
| Shared hooks | 5 | 15+ | +200% |
| Shared components | ~3 | 10+ | +233% |

---

## 10. Next Steps

**AWAITING APPROVAL before proceeding to Phase 2**

Please review this analysis and confirm:
1. Priority order acceptable?
2. Proposed structures make sense?
3. Any files to skip or prioritize differently?
4. Ready to proceed with refactoring?

---

*Generated: Phase 1 Analysis - TSSR Monitor App*
*Total files analyzed: 342*
*Files flagged for refactoring: 71*
