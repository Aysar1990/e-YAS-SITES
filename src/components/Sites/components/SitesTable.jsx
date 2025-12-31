import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import './SitesTable.css'

const SitesTable = ({ 
  sites, 
  selectedSites, 
  onSelect, 
  onEdit,
  onUpdate,
  canEdit 
}) => {
  const { t } = useTranslation()
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' })
  
  // Inline Editing State
  const [editingCell, setEditingCell] = useState(null) // { siteId, field }
  const [tempValue, setTempValue] = useState('')

  // Column Visibility State
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    site_id: true,
    final_site_name: true,
    phase_name: true,
    priority: true,
    site_type: true,
    governorate: true,
    tssr_overall_status: true,
    actions: true
  })

  const ALL_COLUMNS = [
    { key: 'site_id', label: 'ID' },
    { key: 'final_site_name', label: 'Name' },
    { key: 'phase_name', label: 'Phase' },
    { key: 'priority', label: 'Priority' },
    { key: 'site_type', label: 'Type' },
    { key: 'governorate', label: 'Governorate' },
    { key: 'tssr_overall_status', label: 'Status' }
  ]

  // Sorting Handler
  const requestSort = (key) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  // Derived Sorted Sites
  const sortedSites = useMemo(() => {
    let sortableItems = [...sites]
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key] || ''
        let bValue = b[sortConfig.key] || ''
        
        // Handle numbers
        if (!isNaN(aValue) && !isNaN(bValue)) {
            aValue = Number(aValue)
            bValue = Number(bValue)
        } else {
             aValue = String(aValue).toLowerCase()
             bValue = String(bValue).toLowerCase()
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [sites, sortConfig])

  // Helper for Sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕'
    return sortConfig.direction === 'ascending' ? '↑' : '↓'
  }

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase()
    let className = 'badge-default'
    if (s.includes('approved') || s.includes('done')) className = 'badge-success'
    else if (s.includes('rejected')) className = 'badge-danger'
    else if (s.includes('pending') || s.includes('review')) className = 'badge-warning'
    
    return <span className={`status-badge ${className}`}>{status}</span>
  }

  // Inline Edit Handlers
  const startEditing = (site, field) => {
    if (!canEdit) return
    if (field === 'site_id') return // ID not editable
    setEditingCell({ siteId: site.site_id, field })
    setTempValue(site[field])
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setTempValue('')
  }

  const saveEditing = async () => {
    if (!editingCell) return
    const { siteId, field } = editingCell
    
    // Optimistic Update or Wait?
    // Let's call parent Update
    if (onUpdate) {
       await onUpdate(siteId, { [field]: tempValue })
    }
    setEditingCell(null)
    setTempValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveEditing()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // Render Cell Content
  const renderCell = (site, field) => {
    const isEditing = editingCell?.siteId === site.site_id && editingCell?.field === field
    
    if (isEditing) {
      return (
        <input 
          autoFocus
          className="inline-input"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveEditing}
          onKeyDown={handleKeyDown}
        />
      )
    }
    
    if (field === 'phase_name') return <span className="phase-pill">{site[field]}</span>
    if (field === 'tssr_overall_status') return getStatusBadge(site[field])
    if (field === 'final_site_name') return <span className="font-bold">{site[field]}</span>
    if (field === 'site_id') return <span className="font-mono">{site[field]}</span>

    return site[field]
  }

  return (
    <div className="sites-table-container">
      {/* Table Controls */}
      <div className="table-controls">
         <div className="column-visibility-dropdown">
            <button className="btn-secondary btn-sm" onClick={() => setShowColumnMenu(!showColumnMenu)}>
               👁 Columns
            </button>
            {showColumnMenu && (
              <div className="column-menu fade-in">
                 {ALL_COLUMNS.map(col => (
                   <label key={col.key} className="column-menu-item">
                     <input 
                       type="checkbox" 
                       checked={visibleColumns[col.key]} 
                       onChange={() => setVisibleColumns(prev => ({...prev, [col.key]: !prev[col.key]}))}
                     />
                     {col.label}
                   </label>
                 ))}
              </div>
            )}
         </div>
      </div>

      <table className="sites-table">
        <thead>
          <tr>
            <th className="th-checkbox">Select</th>
            {visibleColumns.site_id && <th onClick={() => requestSort('site_id')}>ID {getSortIcon('site_id')}</th>}
            {visibleColumns.final_site_name && <th onClick={() => requestSort('final_site_name')}>Name {getSortIcon('final_site_name')}</th>}
            {visibleColumns.phase_name && <th onClick={() => requestSort('phase_name')}>Phase {getSortIcon('phase_name')}</th>}
            {visibleColumns.priority && <th onClick={() => requestSort('priority')}>Priority {getSortIcon('priority')}</th>}
            {visibleColumns.site_type && <th onClick={() => requestSort('site_type')}>Type {getSortIcon('site_type')}</th>}
            {visibleColumns.governorate && <th onClick={() => requestSort('governorate')}>Governorate {getSortIcon('governorate')}</th>}
            {visibleColumns.tssr_overall_status && <th onClick={() => requestSort('tssr_overall_status')}>Status {getSortIcon('tssr_overall_status')}</th>}
            {visibleColumns.actions && canEdit && <th className="th-actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedSites.map((site) => {
             const isSelected = selectedSites.has(site.site_id)
             return (
              <tr 
                key={site.site_id} 
                className={isSelected ? 'selected' : ''}
                onClick={() => onSelect(site.site_id)}
              >
                <td className="td-checkbox">
                   <div className={`checkbox-cell ${isSelected ? 'checked' : ''}`}>
                     {isSelected && '✓'}
                   </div>
                </td>
                
                {visibleColumns.site_id && <td>{renderCell(site, 'site_id')}</td>}
                
                {visibleColumns.final_site_name && (
                   <td onDoubleClick={() => startEditing(site, 'final_site_name')}>
                      {renderCell(site, 'final_site_name')}
                   </td>
                )}
                
                {visibleColumns.phase_name && <td>{renderCell(site, 'phase_name')}</td>}
                
                {visibleColumns.priority && (
                   <td onDoubleClick={() => startEditing(site, 'priority')}>
                      {renderCell(site, 'priority')}
                   </td>
                )}

                {visibleColumns.site_type && (
                   <td onDoubleClick={() => startEditing(site, 'site_type')}>
                      {renderCell(site, 'site_type')}
                   </td>
                )}

                {visibleColumns.governorate && (
                   <td onDoubleClick={() => startEditing(site, 'governorate')}>
                      {renderCell(site, 'governorate')}
                   </td>
                )}

                {visibleColumns.tssr_overall_status && <td>{renderCell(site, 'tssr_overall_status')}</td>}

                {visibleColumns.actions && canEdit && (
                  <td className="td-actions">
                    <button 
                        className="btn-icon-sm"
                        onClick={(e) => onEdit(site, e)}
                        title={t('common.edit')}
                    >
                      ✎
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export { SitesTable }
