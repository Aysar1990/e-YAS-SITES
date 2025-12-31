/**
 * Reports Filters Component
 * Quick filters for status and governorate with export functionality
 */

import { Card } from '../UI'
import './ReportsFilters.css'

const ReportsFilters = ({
  statusFilter,
  setStatusFilter,
  governorateFilter,
  setGovernorateFilter,
  uniqueStatuses = [],
  uniqueGovernorates = [],
  onReset,
  onExport,
  exporting = false,
  filteredCount,
  totalCount
}) => {
  const handleReset = () => {
    setStatusFilter('all')
    setGovernorateFilter('all')
    if (onReset) onReset()
  }

  return (
    <Card className="reports-filters-card">
      <h3 className="filters-title">Quick Filters & Export</h3>

      <div className="filters-container">
        {/* Status Filter */}
        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Governorate Filter */}
        <div className="filter-group">
          <label className="filter-label">Governorate:</label>
          <select
            className="filter-select"
            value={governorateFilter}
            onChange={(e) => setGovernorateFilter(e.target.value)}
          >
            <option value="all">All Governorates</option>
            {uniqueGovernorates.map(gov => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions">
          <button
            className="btn-reset"
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
          <button
            className="btn-export"
            onClick={onExport}
            disabled={exporting}
            type="button"
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {/* Filter Result Count */}
      <p className="filter-result">
        Showing {filteredCount} of {totalCount} sites
      </p>
    </Card>
  )
}

export default ReportsFilters
