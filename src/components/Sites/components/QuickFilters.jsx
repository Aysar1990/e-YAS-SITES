/**
 * QuickFilters Component
 * Quick filter shortcuts for common statuses
 */

import React from 'react'
import './QuickFilters.css'

const QuickFilters = ({
  filters,
  onToggleFilter,
  onClearAll,
  className = ''
}) => {
  const filterOptions = [
    {
      key: 'approved',
      label: 'Approved',
      icon: '🟢',
      color: '#8FD9D9',
      description: 'Approved sites',
      matchValues: ['approved']
    },
    {
      key: 'zainValidation',
      label: 'Zain Validation',
      icon: '🟣',
      color: '#8FD9D9',
      description: 'TSSR Under Zain validation',
      matchValues: ['tssr under zain validation']
    },
    {
      key: 'romReview',
      label: 'ROM Review',
      icon: '🔵',
      color: '#7dd3fc',
      description: 'TSSR Under ROM Review',
      matchValues: ['tssr under rom review']
    },
    {
      key: 'nokiaNPO',
      label: 'Nokia NPO',
      icon: '🔵',
      color: '#1e3a8a',
      description: 'TSSR Under Nokia NPO Validation',
      matchValues: ['tssr under nokia npo validation']
    },
    {
      key: 'nokiaROM',
      label: 'Nokia ROM',
      icon: '🟡',
      color: '#eab308',
      description: 'TSSR Under Nokia ROM Validation',
      matchValues: ['tssr under nokia rom validation']
    },
    {
      key: 'nokiaGSD',
      label: 'Nokia GSD',
      icon: '🟠',
      color: '#f97316',
      description: 'TSSR Under Nokia GSD Validation',
      matchValues: ['tssr under nokia gsd validation']
    },
    {
      key: 'subconValidation',
      label: 'Subcon Validation',
      icon: '🔵',
      color: '#8FD9D9',
      description: 'TSSR Under Subcon validation',
      matchValues: ['tssr under subcon validation']
    },
    {
      key: 'notSurveyed',
      label: 'Not Surveyed',
      icon: '⚫',
      color: '#64748b',
      description: 'Site not Surveyed',
      matchValues: ['site not surveyed']
    },
    {
      key: 'needAccess',
      label: 'Need Access',
      icon: '🔴',
      color: '#ef4444',
      description: 'Need Access',
      matchValues: ['need access']
    }
  ]

  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <div className={`quick-filters ${className}`}>
      <div className="quick-filters__header">
        <div className="quick-filters__title">
          <span className="quick-filters__icon">🔍</span>
          Quick Filters
          {activeCount > 0 && (
            <span className="quick-filters__badge">{activeCount}</span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            className="quick-filters__clear-all"
            onClick={onClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      <div className="quick-filters__options">
        {filterOptions.map(option => (
          <button
            key={option.key}
            className={`quick-filter ${filters[option.key] ? 'quick-filter--active' : ''}`}
            onClick={() => onToggleFilter(option.key)}
            title={option.description}
            style={{
              '--filter-color': option.color
            }}
          >
            <span className="quick-filter__icon">{option.icon}</span>
            <span className="quick-filter__label">{option.label}</span>
            {filters[option.key] && (
              <span className="quick-filter__check">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickFilters
