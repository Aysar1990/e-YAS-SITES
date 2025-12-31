/**
 * Reports Overview Tab Component
 * Refactored to use modular components
 */

import {
  ReportsSummaryCards,
  ReportsCharts,
  ReportsFilters
} from '../../../../components/Reports'

const OverviewTab = ({
  stats,
  activePhase,
  filteredSites,
  sites,
  statusFilter,
  setStatusFilter,
  governorateFilter,
  setGovernorateFilter,
  exportCurrentView,
  exporting
}) => {
  return (
    <div className="overview-content">
      {/* Summary Statistics Cards */}
      <ReportsSummaryCards stats={stats} activePhase={activePhase} />

      {/* Analytics Charts */}
      <ReportsCharts stats={stats} />

      {/* Quick Filters & Export */}
      <ReportsFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        governorateFilter={governorateFilter}
        setGovernorateFilter={setGovernorateFilter}
        uniqueStatuses={stats.uniqueStatuses || []}
        uniqueGovernorates={stats.uniqueGovernorates || []}
        onExport={exportCurrentView}
        exporting={exporting}
        filteredCount={filteredSites.length}
        totalCount={sites.length}
      />
    </div>
  )
}

export default OverviewTab
