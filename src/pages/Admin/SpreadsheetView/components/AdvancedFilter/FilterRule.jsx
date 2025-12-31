/**
 * Filter Rule Component
 * Single filter condition row
 * PHASE 6: Data Management
 */

import React from 'react'

const FilterRule = ({
  rule,
  index,
  columns = [],
  operators = [],
  enumValues = [],
  showRemove = true,
  onUpdate,
  onRemove
}) => {
  const needsValue = !['isEmpty', 'isNotEmpty'].includes(rule.operator)
  const needsSecondValue = rule.operator === 'between'
  const isEnumField = columns.find(c => c.field === rule.field)?.field?.includes('status')

  return (
    <div className="filter-rule">
      {/* Rule Number */}
      <div className="rule-number">
        {index + 1}
      </div>

      {/* Field Select */}
      <div className="rule-field">
        <select
          value={rule.field}
          onChange={e => onUpdate({ field: e.target.value, value: '', value2: '' })}
          className="field-select"
        >
          <option value="">-- اختر حقل --</option>
          {columns.map(col => (
            <option key={col.field} value={col.field}>
              {col.headerName}
            </option>
          ))}
        </select>
      </div>

      {/* Operator Select */}
      <div className="rule-operator">
        <select
          value={rule.operator}
          onChange={e => onUpdate({ operator: e.target.value })}
          className="operator-select"
          disabled={!rule.field}
        >
          {operators.map(op => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {/* Value Input */}
      <div className="rule-value">
        {needsValue && (
          isEnumField && enumValues.length > 0 ? (
            <select
              value={rule.value}
              onChange={e => onUpdate({ value: e.target.value })}
              className="value-select"
              disabled={!rule.field}
            >
              <option value="">-- اختر قيمة --</option>
              {enumValues.map(val => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={rule.operator?.includes('Than') || rule.operator === 'between' ? 'number' : 'text'}
              value={rule.value}
              onChange={e => onUpdate({ value: e.target.value })}
              placeholder="القيمة..."
              className="value-input"
              disabled={!rule.field}
            />
          )
        )}

        {needsSecondValue && (
          <>
            <span className="value-separator">و</span>
            <input
              type="number"
              value={rule.value2}
              onChange={e => onUpdate({ value2: e.target.value })}
              placeholder="إلى..."
              className="value-input value2"
              disabled={!rule.field}
            />
          </>
        )}

        {!needsValue && (
          <span className="no-value-label">
            {rule.operator === 'isEmpty' ? '(فارغ)' : '(غير فارغ)'}
          </span>
        )}
      </div>

      {/* Remove Button */}
      {showRemove && (
        <button className="btn-remove-rule" onClick={onRemove} title="حذف القاعدة">
          ×
        </button>
      )}
    </div>
  )
}

export default FilterRule
