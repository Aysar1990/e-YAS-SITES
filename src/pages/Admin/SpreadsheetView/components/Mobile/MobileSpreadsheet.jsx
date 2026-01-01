/**
 * MobileSpreadsheet - Mobile-optimized spreadsheet view
 * Phase 9: Mobile & Print
 *
 * Features:
 * - Card view (default) and Table view toggle
 * - Search bar with stats summary
 * - Pull-to-refresh functionality
 * - Touch-optimized interactions
 */

import React, { useState, useMemo, useCallback } from 'react'
import TouchControls from './TouchControls'
import './Mobile.css'

// Status color mapping
const STATUS_COLORS = {
  approved: '#8FD9D9',
  pending: '#EAB308',
  rejected: '#EF4444',
  rfi: '#F97316',
  under: '#FF8566'
}

const getStatusColor = (status) => {
  if (!status) return '#6B7280'
  const lower = status.toLowerCase()
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (lower.includes(key)) return color
  }
  return '#6B7280'
}

const MobileSpreadsheet = ({
  data = [],
  onRefresh,
  onRowClick,
  onRowAction,
  loading = false
}) => {
  const [viewMode, setViewMode] = useState('card') // 'card' or 'table'
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedCard, setExpandedCard] = useState(null)

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    return data.filter(row =>
      row.site_id?.toLowerCase().includes(query) ||
      row.site_name?.toLowerCase().includes(query) ||
      row.governorate?.toLowerCase().includes(query) ||
      row.contractor?.toLowerCase().includes(query)
    )
  }, [data, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredData.length
    const approved = filteredData.filter(d =>
      d.tssr_status?.toLowerCase().includes('approved')
    ).length
    const pending = filteredData.filter(d =>
      d.tssr_status?.toLowerCase().includes('pending') ||
      d.tssr_status?.toLowerCase().includes('under')
    ).length

    return { total, approved, pending }
  }, [filteredData])

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    if (onRefresh) {
      await onRefresh()
    }
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [onRefresh])

  // Handle card expansion
  const toggleCardExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id)
  }

  // Handle swipe actions
  const handleSwipeAction = (action, row) => {
    if (onRowAction) {
      onRowAction(action, row)
    }
  }

  return (
    <div className="mobile-spreadsheet">
      {/* Header */}
      <div className="mobile-header">
        <h1>📊 TSSR Sites</h1>
        <div className="view-toggle">
          <button
            className={viewMode === 'card' ? 'active' : ''}
            onClick={() => setViewMode('card')}
          >
            ▦ بطاقات
          </button>
          <button
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
          >
            ≡ جدول
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mobile-search">
        <input
          type="text"
          placeholder="🔍 بحث عن موقع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mobile-stats">
        <div className="stat-badge total">
          <span className="value">{stats.total}</span>
          <span className="label">إجمالي</span>
        </div>
        <div className="stat-badge approved">
          <span className="value">{stats.approved}</span>
          <span className="label">معتمد</span>
        </div>
        <div className="stat-badge pending">
          <span className="value">{stats.pending}</span>
          <span className="label">قيد الانتظار</span>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      {isRefreshing && (
        <div className="refresh-indicator">
          <div className="spinner-mobile"></div>
          <span>جاري التحديث...</span>
        </div>
      )}

      {/* Content */}
      <div
        className={`mobile-content ${viewMode}`}
        onTouchStart={(e) => {
          // Track initial touch for pull-to-refresh
          e.currentTarget.dataset.touchStart = e.touches[0].clientY
        }}
        onTouchEnd={(e) => {
          const startY = parseFloat(e.currentTarget.dataset.touchStart)
          const endY = e.changedTouches[0].clientY
          if (endY - startY > 100 && e.currentTarget.scrollTop === 0) {
            handleRefresh()
          }
        }}
      >
        {loading ? (
          <div className="mobile-loading">
            <div className="spinner-mobile large"></div>
            <p>جاري التحميل...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="mobile-empty">
            <span className="empty-icon">📭</span>
            <p>لا توجد نتائج</p>
          </div>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="cards-container">
            {filteredData.map((row) => (
              <TouchControls
                key={row.site_id || row.id}
                onSwipeLeft={() => handleSwipeAction('delete', row)}
                onSwipeRight={() => handleSwipeAction('edit', row)}
                onLongPress={() => handleSwipeAction('select', row)}
              >
                <div
                  className={`site-card ${expandedCard === row.site_id ? 'expanded' : ''}`}
                  onClick={() => toggleCardExpand(row.site_id)}
                >
                  <div className="card-header">
                    <span className="site-id">{row.site_id}</span>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(row.tssr_status) }}
                    >
                      {row.tssr_status || 'N/A'}
                    </span>
                  </div>

                  <div className="card-title">{row.site_name || 'اسم غير محدد'}</div>

                  <div className="card-meta">
                    <span>📍 {row.governorate || 'غير محدد'}</span>
                    <span>👷 {row.contractor || 'غير محدد'}</span>
                  </div>

                  {expandedCard === row.site_id && (
                    <div className="card-details">
                      <div className="detail-row">
                        <span className="label">المنطقة:</span>
                        <span className="value">{row.region || '-'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">جزء من:</span>
                        <span className="value">{row.part_of || '-'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">حالة القسم:</span>
                        <span className="value">{row.dept_status || '-'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">الأولوية:</span>
                        <span className="value">{row.priority || '-'}</span>
                      </div>

                      <div className="card-actions">
                        <button onClick={(e) => { e.stopPropagation(); onRowClick?.(row) }}>
                          👁️ عرض
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSwipeAction('edit', row) }}>
                          ✏️ تعديل
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </TouchControls>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="table-container">
            <table className="mobile-table">
              <thead>
                <tr>
                  <th>Site ID</th>
                  <th>المحافظة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row.site_id || row.id} onClick={() => onRowClick?.(row)}>
                    <td>{row.site_id}</td>
                    <td>{row.governorate || '-'}</td>
                    <td>
                      <span
                        className="status-dot"
                        style={{ backgroundColor: getStatusColor(row.tssr_status) }}
                      ></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mobile-footer">
        <span>عرض {filteredData.length} من {data.length}</span>
        <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
          🔄 تحديث
        </button>
      </div>
    </div>
  )
}

export default MobileSpreadsheet
