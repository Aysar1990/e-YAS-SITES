/**
 * Column Mapper Component
 * Map Excel columns to database fields
 * PHASE 6: Data Management
 */

import React, { useMemo, useState } from 'react'

const ColumnMapper = ({
  excelHeaders = [],
  dbColumns = [],
  mapping = {},
  onMappingChange,
  onClearMapping
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  // Get unmapped DB columns
  const mappedFields = Object.values(mapping).filter(Boolean)
  const unmappedDbColumns = useMemo(() => {
    return dbColumns.filter(col => !mappedFields.includes(col.field))
  }, [dbColumns, mappedFields])

  // Filter Excel headers by search
  const filteredHeaders = useMemo(() => {
    if (!searchTerm) return excelHeaders
    const term = searchTerm.toLowerCase()
    return excelHeaders.filter(h => h.toLowerCase().includes(term))
  }, [excelHeaders, searchTerm])

  // Auto-map matching columns
  const handleAutoMap = () => {
    excelHeaders.forEach(header => {
      if (!mapping[header]) {
        const matchedCol = dbColumns.find(col =>
          col.field.toLowerCase() === header.toLowerCase() ||
          col.headerName.toLowerCase() === header.toLowerCase() ||
          col.field.toLowerCase().replace(/_/g, '') === header.toLowerCase().replace(/\s/g, '') ||
          col.headerName.toLowerCase().replace(/\s/g, '') === header.toLowerCase().replace(/\s/g, '')
        )
        if (matchedCol && !mappedFields.includes(matchedCol.field)) {
          onMappingChange(header, matchedCol.field)
        }
      }
    })
  }

  // Clear all mappings
  const handleClearAll = () => {
    excelHeaders.forEach(header => {
      if (mapping[header]) {
        onClearMapping(header)
      }
    })
  }

  return (
    <div className="column-mapper">
      <div className="mapper-toolbar">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث في الأعمدة..."
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
        <div className="mapper-actions">
          <button className="btn-auto-map" onClick={handleAutoMap}>
            🔗 ربط تلقائي
          </button>
          <button className="btn-clear-all" onClick={handleClearAll}>
            🗑️ مسح الكل
          </button>
        </div>
      </div>

      <div className="mapping-stats">
        <span className="stat mapped">
          ✓ {mappedFields.length} مربوط
        </span>
        <span className="stat unmapped">
          ○ {excelHeaders.length - mappedFields.length} غير مربوط
        </span>
      </div>

      <div className="mapping-list">
        {filteredHeaders.map(header => {
          const isMapped = !!mapping[header]
          const mappedTo = isMapped ? dbColumns.find(c => c.field === mapping[header]) : null

          return (
            <div key={header} className={`mapping-item ${isMapped ? 'mapped' : ''}`}>
              <div className="excel-col">
                <span className="col-icon">📊</span>
                <span className="col-name" title={header}>
                  {header.length > 25 ? header.substring(0, 25) + '...' : header}
                </span>
              </div>

              <div className="mapping-arrow">
                {isMapped ? '→' : '○'}
              </div>

              <div className="db-col-select">
                {isMapped ? (
                  <div className="mapped-field">
                    <span className="field-name">{mappedTo?.headerName || mapping[header]}</span>
                    <button
                      className="btn-clear-mapping"
                      onClick={() => onClearMapping(header)}
                      title="إزالة الربط"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <select
                    value=""
                    onChange={e => onMappingChange(header, e.target.value)}
                    className="field-select"
                  >
                    <option value="">-- اختر حقل --</option>
                    {unmappedDbColumns.map(col => (
                      <option key={col.field} value={col.field}>
                        {col.headerName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredHeaders.length === 0 && (
        <div className="no-headers">
          <span>لا توجد أعمدة تطابق البحث</span>
        </div>
      )}
    </div>
  )
}

export default ColumnMapper
