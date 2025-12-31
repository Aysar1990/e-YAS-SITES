/**
 * Bulk Edit Modal Component
 * Select field, value, and apply to multiple selected rows
 * PHASE 6: Data Management
 */

import React, { useState, useCallback, useMemo } from 'react'
import { STATUS_VALUES } from '../../utils/validation'
import './BulkEditModal.css'

// Fields that can be bulk edited
const EDITABLE_FIELDS = [
  { field: 'tssr_overall_status', label: 'TSSR Overall Status', type: 'enum', values: STATUS_VALUES },
  { field: 'ti_status', label: 'TI Status', type: 'enum', values: STATUS_VALUES },
  { field: 'rf_plan_status', label: 'RF Plan Status', type: 'enum', values: STATUS_VALUES },
  { field: 'rf_optim_status', label: 'RF Optim Status', type: 'enum', values: STATUS_VALUES },
  { field: 'civil_status', label: 'Civil Status', type: 'enum', values: STATUS_VALUES },
  { field: 'mw_status', label: 'MW Status', type: 'enum', values: STATUS_VALUES },
  { field: 'nokia_npo_status', label: 'Nokia NPO Status', type: 'enum', values: STATUS_VALUES },
  { field: 'governorate', label: 'Governorate', type: 'text' },
  { field: 'phase_name', label: 'Phase', type: 'text' },
  { field: 'priority', label: 'Priority', type: 'text' },
  { field: 'cluster', label: 'Cluster', type: 'text' },
  { field: 'weekly_plan', label: 'Weekly Plan', type: 'text' },
  { field: 'notes', label: 'Notes', type: 'text' }
]

const BulkEditModal = ({
  selectedRows = [],
  onApply,
  onClose
}) => {
  const [selectedField, setSelectedField] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [preview, setPreview] = useState(false)

  // Get the field configuration
  const fieldConfig = useMemo(() => {
    return EDITABLE_FIELDS.find(f => f.field === selectedField)
  }, [selectedField])

  // Get unique current values for the selected field
  const currentValues = useMemo(() => {
    if (!selectedField || selectedRows.length === 0) return []

    const values = new Map()
    selectedRows.forEach(row => {
      const val = row[selectedField] || '(فارغ)'
      values.set(val, (values.get(val) || 0) + 1)
    })

    return Array.from(values.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
  }, [selectedField, selectedRows])

  // Handle field change
  const handleFieldChange = useCallback((e) => {
    setSelectedField(e.target.value)
    setNewValue('')
    setPreview(false)
  }, [])

  // Handle apply
  const handleApply = useCallback(async () => {
    if (!selectedField || newValue === '') return

    setIsApplying(true)
    try {
      await onApply(selectedField, newValue, selectedRows)
      onClose()
    } catch (error) {
      console.error('[BulkEdit] Apply error:', error)
    } finally {
      setIsApplying(false)
    }
  }, [selectedField, newValue, selectedRows, onApply, onClose])

  // Validate if can apply
  const canApply = selectedField && newValue !== '' && selectedRows.length > 0 && !isApplying

  return (
    <div className="bulk-edit-overlay" onClick={onClose}>
      <div className="bulk-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="bulk-edit-header">
          <div className="header-info">
            <span className="header-icon">📝</span>
            <h3>تعديل جماعي</h3>
          </div>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="bulk-edit-content">
          {/* Selection Info */}
          <div className="selection-info-box">
            <span className="info-icon">ℹ️</span>
            <span>تم تحديد <strong>{selectedRows.length}</strong> صف للتعديل</span>
          </div>

          {selectedRows.length === 0 ? (
            <div className="no-selection-warning">
              <span className="warning-icon">⚠️</span>
              <p>الرجاء تحديد صفوف من الجدول أولاً</p>
              <small>استخدم Ctrl+Click أو Shift+Click لتحديد صفوف متعددة</small>
            </div>
          ) : (
            <>
              {/* Field Selection */}
              <div className="form-group">
                <label>اختر الحقل للتعديل:</label>
                <select
                  value={selectedField}
                  onChange={handleFieldChange}
                  className="field-select"
                >
                  <option value="">-- اختر حقل --</option>
                  {EDITABLE_FIELDS.map(f => (
                    <option key={f.field} value={f.field}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Values Preview */}
              {selectedField && currentValues.length > 0 && (
                <div className="current-values">
                  <label>القيم الحالية:</label>
                  <div className="values-list">
                    {currentValues.slice(0, 5).map(({ value, count }) => (
                      <span key={value} className="value-chip">
                        {value} <span className="count">({count})</span>
                      </span>
                    ))}
                    {currentValues.length > 5 && (
                      <span className="more-values">+{currentValues.length - 5} المزيد</span>
                    )}
                  </div>
                </div>
              )}

              {/* New Value Input */}
              {selectedField && fieldConfig && (
                <div className="form-group">
                  <label>القيمة الجديدة:</label>
                  {fieldConfig.type === 'enum' ? (
                    <select
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      className="value-select"
                    >
                      <option value="">-- اختر قيمة --</option>
                      {fieldConfig.values.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      placeholder="أدخل القيمة الجديدة..."
                      className="value-input"
                    />
                  )}
                </div>
              )}

              {/* Preview Toggle */}
              {canApply && (
                <div className="preview-section">
                  <label className="preview-toggle">
                    <input
                      type="checkbox"
                      checked={preview}
                      onChange={e => setPreview(e.target.checked)}
                    />
                    <span>معاينة التغييرات</span>
                  </label>

                  {preview && (
                    <div className="preview-box">
                      <div className="preview-header">
                        <span>سيتم تغيير:</span>
                      </div>
                      <div className="preview-content">
                        <div className="preview-item">
                          <span className="field-name">{fieldConfig?.label}</span>
                          <span className="arrow">→</span>
                          <span className="new-value">{newValue}</span>
                        </div>
                        <div className="preview-rows">
                          في {selectedRows.length} صف
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="bulk-edit-footer">
          <button className="btn-cancel" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="btn-apply"
            onClick={handleApply}
            disabled={!canApply}
          >
            {isApplying ? (
              <>
                <span className="spinner-tiny"></span>
                جاري التطبيق...
              </>
            ) : (
              <>
                تطبيق على {selectedRows.length} صف
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkEditModal
