/**
 * Reports Custom Builder Tab Component
 */

import { Card } from '../../../../components/UI'
import { AVAILABLE_COLUMNS, COLUMN_MAP } from '../config'

const BuilderTab = ({
  selectedColumns,
  toggleColumn,
  filters,
  addFilter,
  updateFilter,
  removeFilter,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  buildPreview,
  exportCurrentView,
  exporting,
  filteredSites,
  previewData
}) => {
  return (
    <div className="builder-content">
      {/* Column Selector */}
      <Card className="builder-section">
        <h3 className="section-title">Select Columns</h3>
        <div className="columns-grid">
          {AVAILABLE_COLUMNS.map(col => (
            <label key={col} className="column-checkbox">
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={() => toggleColumn(col)}
              />
              <span>{col}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Filter Builder */}
      <Card className="builder-section">
        <div className="section-header">
          <h3 className="section-title">Filters</h3>
          <button className="btn-add-filter" onClick={addFilter}>+ Add Filter</button>
        </div>
        {filters.length === 0 && (
          <p className="no-filters">No filters applied. Click "Add Filter" to add conditions.</p>
        )}
        {filters.map((filter, index) => (
          <div key={index} className="filter-row">
            <select
              value={filter.field}
              onChange={(e) => updateFilter(index, 'field', e.target.value)}
            >
              <option value="">Select Field...</option>
              {AVAILABLE_COLUMNS.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <select
              value={filter.operator}
              onChange={(e) => updateFilter(index, 'operator', e.target.value)}
            >
              <option value="contains">Contains</option>
              <option value="equals">Equals</option>
              <option value="not_contains">Not Contains</option>
              <option value="not_equals">Not Equals</option>
            </select>
            <input
              type="text"
              placeholder="Value..."
              value={filter.value}
              onChange={(e) => updateFilter(index, 'value', e.target.value)}
            />
            <button className="btn-remove-filter" onClick={() => removeFilter(index)}>x</button>
          </div>
        ))}
      </Card>

      {/* Sort Options */}
      <Card className="builder-section">
        <h3 className="section-title">Sort Options</h3>
        <div className="sort-options">
          <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
            {selectedColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </Card>

      {/* Actions */}
      <div className="builder-actions">
        <button className="btn-preview" onClick={buildPreview}>
          Preview (First 10)
        </button>
        <button className="btn-export-full" onClick={exportCurrentView} disabled={exporting}>
          {exporting ? 'Exporting...' : `Export All (${filteredSites.length} sites)`}
        </button>
      </div>

      {/* Preview Table */}
      {previewData && (
        <Card className="preview-section">
          <h3 className="section-title">Preview ({previewData.length} rows)</h3>
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  {selectedColumns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((site, idx) => (
                  <tr key={idx}>
                    {selectedColumns.map(col => (
                      <td key={col}>{site[COLUMN_MAP[col]] || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default BuilderTab
