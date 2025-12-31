/**
 * Advanced Filter Builder Component
 * Build complex AND/OR filters for the grid
 * PHASE 6: Data Management
 */

import React, { useState, useCallback, useMemo } from 'react'
import FilterRule from './FilterRule'
import './AdvancedFilter.css'

// Operators by field type
const OPERATORS = {
  text: [
    { value: 'contains', label: 'يحتوي على' },
    { value: 'notContains', label: 'لا يحتوي على' },
    { value: 'equals', label: 'يساوي' },
    { value: 'notEquals', label: 'لا يساوي' },
    { value: 'startsWith', label: 'يبدأ بـ' },
    { value: 'endsWith', label: 'ينتهي بـ' },
    { value: 'isEmpty', label: 'فارغ' },
    { value: 'isNotEmpty', label: 'غير فارغ' }
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'notEquals', label: '≠' },
    { value: 'greaterThan', label: '>' },
    { value: 'greaterThanOrEqual', label: '≥' },
    { value: 'lessThan', label: '<' },
    { value: 'lessThanOrEqual', label: '≤' },
    { value: 'between', label: 'بين' },
    { value: 'isEmpty', label: 'فارغ' }
  ],
  enum: [
    { value: 'equals', label: 'يساوي' },
    { value: 'notEquals', label: 'لا يساوي' },
    { value: 'in', label: 'ضمن' },
    { value: 'notIn', label: 'ليس ضمن' }
  ]
}

const FilterBuilder = ({
  columns = [],
  data = [],
  onApplyFilter,
  onClose
}) => {
  const [rules, setRules] = useState([createEmptyRule()])
  const [combineWith, setCombineWith] = useState('AND') // AND or OR
  const [filterName, setFilterName] = useState('')
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('spreadsheet_saved_filters') || '[]')
    } catch {
      return []
    }
  })

  // Create empty rule
  function createEmptyRule() {
    return {
      id: Date.now() + Math.random(),
      field: '',
      operator: 'contains',
      value: '',
      value2: '' // For 'between' operator
    }
  }

  // Get field type
  const getFieldType = useCallback((fieldName) => {
    const col = columns.find(c => c.field === fieldName)
    if (!col) return 'text'
    if (col.type === 'number') return 'number'
    if (col.field.includes('status')) return 'enum'
    return 'text'
  }, [columns])

  // Get unique values for enum fields
  const getEnumValues = useCallback((fieldName) => {
    const values = new Set()
    data.forEach(row => {
      if (row[fieldName]) {
        values.add(row[fieldName])
      }
    })
    return Array.from(values).sort()
  }, [data])

  // Add new rule
  const handleAddRule = useCallback(() => {
    setRules(prev => [...prev, createEmptyRule()])
  }, [])

  // Remove rule
  const handleRemoveRule = useCallback((ruleId) => {
    setRules(prev => prev.filter(r => r.id !== ruleId))
  }, [])

  // Update rule
  const handleUpdateRule = useCallback((ruleId, updates) => {
    setRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    ))
  }, [])

  // Clear all rules
  const handleClearRules = useCallback(() => {
    setRules([createEmptyRule()])
  }, [])

  // Apply filter logic to data
  const applyFilterLogic = useCallback((row, rule) => {
    const value = row[rule.field]
    const filterValue = rule.value
    const operator = rule.operator

    // Handle empty checks first
    if (operator === 'isEmpty') {
      return !value || value === ''
    }
    if (operator === 'isNotEmpty') {
      return value && value !== ''
    }

    // Convert to strings for text operations
    const strValue = String(value || '').toLowerCase()
    const strFilter = String(filterValue || '').toLowerCase()

    switch (operator) {
      case 'contains':
        return strValue.includes(strFilter)
      case 'notContains':
        return !strValue.includes(strFilter)
      case 'equals':
        return strValue === strFilter || value === filterValue
      case 'notEquals':
        return strValue !== strFilter && value !== filterValue
      case 'startsWith':
        return strValue.startsWith(strFilter)
      case 'endsWith':
        return strValue.endsWith(strFilter)
      case 'greaterThan':
        return parseFloat(value) > parseFloat(filterValue)
      case 'greaterThanOrEqual':
        return parseFloat(value) >= parseFloat(filterValue)
      case 'lessThan':
        return parseFloat(value) < parseFloat(filterValue)
      case 'lessThanOrEqual':
        return parseFloat(value) <= parseFloat(filterValue)
      case 'between':
        const num = parseFloat(value)
        const min = parseFloat(filterValue)
        const max = parseFloat(rule.value2)
        return num >= min && num <= max
      case 'in':
        const inValues = filterValue.split(',').map(v => v.trim().toLowerCase())
        return inValues.includes(strValue)
      case 'notIn':
        const notInValues = filterValue.split(',').map(v => v.trim().toLowerCase())
        return !notInValues.includes(strValue)
      default:
        return true
    }
  }, [])

  // Apply filter to data
  const handleApplyFilter = useCallback(() => {
    const validRules = rules.filter(r => r.field && r.operator)

    if (validRules.length === 0) {
      onApplyFilter(data, null)
      return
    }

    const filtered = data.filter(row => {
      const results = validRules.map(rule => applyFilterLogic(row, rule))

      if (combineWith === 'AND') {
        return results.every(r => r)
      } else {
        return results.some(r => r)
      }
    })

    onApplyFilter(filtered, {
      rules: validRules,
      combineWith,
      name: filterName || 'Custom Filter'
    })
  }, [rules, combineWith, data, applyFilterLogic, onApplyFilter, filterName])

  // Save filter
  const handleSaveFilter = useCallback(() => {
    if (!filterName.trim()) return

    const newFilter = {
      id: Date.now(),
      name: filterName,
      rules: rules.filter(r => r.field && r.operator),
      combineWith,
      createdAt: new Date().toISOString()
    }

    const updated = [...savedFilters, newFilter]
    setSavedFilters(updated)
    localStorage.setItem('spreadsheet_saved_filters', JSON.stringify(updated))
    setFilterName('')
  }, [filterName, rules, combineWith, savedFilters])

  // Load saved filter
  const handleLoadFilter = useCallback((filter) => {
    setRules(filter.rules.map(r => ({ ...r, id: Date.now() + Math.random() })))
    setCombineWith(filter.combineWith)
    setFilterName(filter.name)
  }, [])

  // Delete saved filter
  const handleDeleteSavedFilter = useCallback((filterId) => {
    const updated = savedFilters.filter(f => f.id !== filterId)
    setSavedFilters(updated)
    localStorage.setItem('spreadsheet_saved_filters', JSON.stringify(updated))
  }, [savedFilters])

  // Count matching rows
  const matchCount = useMemo(() => {
    const validRules = rules.filter(r => r.field && r.operator)
    if (validRules.length === 0) return data.length

    return data.filter(row => {
      const results = validRules.map(rule => applyFilterLogic(row, rule))
      return combineWith === 'AND' ? results.every(r => r) : results.some(r => r)
    }).length
  }, [rules, combineWith, data, applyFilterLogic])

  return (
    <div className="filter-builder-overlay" onClick={onClose}>
      <div className="filter-builder-modal" onClick={e => e.stopPropagation()}>
        <div className="filter-builder-header">
          <div className="header-info">
            <span className="header-icon">🔍</span>
            <h3>فلتر متقدم</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="filter-builder-content">
          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="saved-filters-section">
              <label>الفلاتر المحفوظة:</label>
              <div className="saved-filters-list">
                {savedFilters.map(filter => (
                  <div key={filter.id} className="saved-filter-item">
                    <span
                      className="filter-name"
                      onClick={() => handleLoadFilter(filter)}
                    >
                      {filter.name}
                    </span>
                    <button
                      className="btn-delete-filter"
                      onClick={() => handleDeleteSavedFilter(filter.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Combine Logic */}
          <div className="combine-section">
            <label>دمج القواعد باستخدام:</label>
            <div className="combine-buttons">
              <button
                className={`btn-combine ${combineWith === 'AND' ? 'active' : ''}`}
                onClick={() => setCombineWith('AND')}
              >
                AND (كل القواعد)
              </button>
              <button
                className={`btn-combine ${combineWith === 'OR' ? 'active' : ''}`}
                onClick={() => setCombineWith('OR')}
              >
                OR (أي قاعدة)
              </button>
            </div>
          </div>

          {/* Rules List */}
          <div className="rules-section">
            <div className="rules-header">
              <label>قواعد الفلترة:</label>
              <button className="btn-add-rule" onClick={handleAddRule}>
                + إضافة قاعدة
              </button>
            </div>

            <div className="rules-list">
              {rules.map((rule, index) => (
                <FilterRule
                  key={rule.id}
                  rule={rule}
                  index={index}
                  columns={columns}
                  operators={OPERATORS[getFieldType(rule.field)] || OPERATORS.text}
                  enumValues={getFieldType(rule.field) === 'enum' ? getEnumValues(rule.field) : []}
                  showRemove={rules.length > 1}
                  onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
                  onRemove={() => handleRemoveRule(rule.id)}
                />
              ))}
            </div>
          </div>

          {/* Match Count */}
          <div className="match-count">
            <span className="count-value">{matchCount}</span>
            <span className="count-label">صف يطابق الفلتر من أصل {data.length}</span>
          </div>

          {/* Save Filter */}
          <div className="save-filter-section">
            <input
              type="text"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              placeholder="اسم الفلتر للحفظ..."
              className="filter-name-input"
            />
            <button
              className="btn-save-filter"
              onClick={handleSaveFilter}
              disabled={!filterName.trim()}
            >
              💾 حفظ
            </button>
          </div>
        </div>

        <div className="filter-builder-footer">
          <button className="btn-clear" onClick={handleClearRules}>
            مسح الكل
          </button>
          <button className="btn-cancel" onClick={onClose}>
            إلغاء
          </button>
          <button className="btn-apply-filter" onClick={handleApplyFilter}>
            تطبيق ({matchCount} صف)
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterBuilder
