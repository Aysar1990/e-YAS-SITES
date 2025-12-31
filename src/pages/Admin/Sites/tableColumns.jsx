/**
 * Table Columns Configuration for Sites VirtualizedTable
 * Extracted from Sites.jsx
 */

import React from 'react'

/**
 * Get table columns configuration for VirtualizedTable
 */
export const getTableColumns = () => [
  {
    key: 'site_id',
    label: 'Site ID',
    width: 100,
    minWidth: 100,
    render: (value) => <strong style={{ color: '#8FD9D9' }}>{value}</strong>
  },
  {
    key: 'final_site_name',
    label: 'Site Name',
    flex: 2,
    minWidth: 150
  },
  {
    key: 'phase_name',
    label: 'Phase',
    width: 100,
    minWidth: 80
  },
  {
    key: 'priority',
    label: 'Priority',
    width: 100,
    minWidth: 80,
    render: (value) => {
      const priority = String(value || '').toLowerCase()
      const color = priority.includes('p1') ? '#ef4444' :
                    priority.includes('p2') ? '#f97316' :
                    priority.includes('p3') ? '#eab308' : '#64748b'
      return <span style={{ color, fontWeight: '600' }}>{value}</span>
    }
  },
  {
    key: 'governorate',
    label: 'Governorate',
    width: 120,
    minWidth: 100
  },
  {
    key: 'tssr_overall_status',
    label: 'Status',
    flex: 1,
    minWidth: 120,
    render: (value) => {
      const status = String(value || '').toLowerCase()
      const color = status.includes('approved') ? '#22c55e' :
                    status.includes('rejected') ? '#ef4444' :
                    status.includes('pending') || status.includes('review') ? '#eab308' : '#64748b'
      return (
        <span style={{
          padding: '0.25rem 0.75rem',
          background: `${color}22`,
          color,
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}>
          {value}
        </span>
      )
    }
  }
]

export default getTableColumns
