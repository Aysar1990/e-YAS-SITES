/**
 * RuleEditor Component
 * Modal for editing formatting rules
 * Extracted from FormattingRules.jsx
 */

import { useState } from 'react'
import { ruleTypes, ruleTypeLabels } from '../utils/formattingRules'

// Convert hex color to rgba with transparency
const hexToRgba = (hex, alpha = 0.2) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Extract hex from rgba
const rgbaToHex = (rgba) => {
  if (!rgba) return '#8FD9D9'
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0')
    const g = parseInt(match[2]).toString(16).padStart(2, '0')
    const b = parseInt(match[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  return rgba.startsWith('#') ? rgba : '#8FD9D9'
}

// Check if condition type needs a value
const needsValue = (type) => {
  return ![ruleTypes.IS_EMPTY, ruleTypes.IS_NOT_EMPTY].includes(type)
}

// Check if condition type is numeric
const isNumericCondition = (type) => {
  return [
    ruleTypes.NUMBER_GREATER,
    ruleTypes.NUMBER_LESS,
    ruleTypes.NUMBER_BETWEEN,
    ruleTypes.NUMBER_EQUALS
  ].includes(type)
}

const RuleEditor = ({ rule, columns, onSave, onCancel }) => {
  const [editedRule, setEditedRule] = useState({ ...rule })
  const [errors, setErrors] = useState([])

  const updateField = (field, value) => {
    setEditedRule(prev => ({ ...prev, [field]: value }))
  }

  const updateCondition = (field, value) => {
    setEditedRule(prev => ({
      ...prev,
      condition: { ...prev.condition, [field]: value }
    }))
  }

  const updateFormat = (field, value) => {
    setEditedRule(prev => ({
      ...prev,
      format: { ...prev.format, [field]: value }
    }))
  }

  const handleSave = () => {
    const validationErrors = []
    if (!editedRule.name.trim()) validationErrors.push('Rule name is required')
    if (needsValue(editedRule.condition.type) && !editedRule.condition.value) {
      validationErrors.push('Condition value is required')
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    onSave(editedRule)
  }

  return (
    <div className="rule-editor-overlay" onClick={onCancel}>
      <div className="rule-editor" onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <h4>✏️ Edit Rule</h4>
          <button onClick={onCancel} className="btn-close">✕</button>
        </div>

        {errors.length > 0 && (
          <div className="editor-errors">
            {errors.map((error, i) => <div key={i} className="error-message">⚠️ {error}</div>)}
          </div>
        )}

        <div className="editor-body">
          <div className="editor-field">
            <label>Rule Name *</label>
            <input type="text" value={editedRule.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g., Approved - Green Background" />
          </div>

          <div className="editor-field">
            <label>Apply to Field</label>
            <select value={editedRule.field || ''} onChange={(e) => updateField('field', e.target.value || null)}>
              <option value="">All fields (global rule)</option>
              {columns.map(col => <option key={col.field} value={col.field}>{col.headerName || col.field}</option>)}
            </select>
            <small>Leave empty to apply to any matching cell</small>
          </div>

          <div className="editor-field">
            <label>Condition Type *</label>
            <select value={editedRule.condition.type} onChange={(e) => updateCondition('type', e.target.value)}>
              {Object.entries(ruleTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          {needsValue(editedRule.condition.type) && (
            <div className="editor-field">
              <label>Condition Value *</label>
              {editedRule.condition.type === ruleTypes.NUMBER_BETWEEN ? (
                <div className="between-inputs">
                  <input type="number" value={editedRule.condition.min || ''} onChange={(e) => updateCondition('min', e.target.value)} placeholder="Min" />
                  <span>to</span>
                  <input type="number" value={editedRule.condition.max || ''} onChange={(e) => updateCondition('max', e.target.value)} placeholder="Max" />
                </div>
              ) : (
                <input type={isNumericCondition(editedRule.condition.type) ? 'number' : 'text'} value={editedRule.condition.value || ''} onChange={(e) => updateCondition('value', e.target.value)} placeholder={isNumericCondition(editedRule.condition.type) ? 'Enter number...' : 'Enter text to match...'} />
              )}
            </div>
          )}

          <div className="editor-divider"><span>Formatting Options</span></div>

          <div className="editor-field color-field">
            <label>Background Color</label>
            <div className="color-input-group">
              <input type="color" value={rgbaToHex(editedRule.format.value)} onChange={(e) => updateFormat('value', hexToRgba(e.target.value, 0.2))} />
              <span className="color-preview" style={{ backgroundColor: editedRule.format.value }}>Preview</span>
              <button className="btn-clear" onClick={() => updateFormat('value', null)} title="Clear background">✕</button>
            </div>
          </div>

          <div className="editor-field color-field">
            <label>Text Color</label>
            <div className="color-input-group">
              <input type="color" value={editedRule.format.textColor || '#8FD9D9'} onChange={(e) => updateFormat('textColor', e.target.value)} />
              <span className="color-preview" style={{ color: editedRule.format.textColor, backgroundColor: '#1a1a2e' }}>Preview</span>
              <button className="btn-clear" onClick={() => updateFormat('textColor', null)} title="Clear text color">✕</button>
            </div>
          </div>

          <div className="editor-field checkbox-field">
            <label>
              <input type="checkbox" checked={editedRule.format.fontWeight === 'bold'} onChange={(e) => updateFormat('fontWeight', e.target.checked ? 'bold' : null)} />
              <span>Bold text</span>
            </label>
          </div>

          <div className="editor-field checkbox-field">
            <label>
              <input type="checkbox" checked={editedRule.format.fontStyle === 'italic'} onChange={(e) => updateFormat('fontStyle', e.target.checked ? 'italic' : null)} />
              <span>Italic text</span>
            </label>
          </div>

          <div className="editor-field preview-field">
            <label>Live Preview</label>
            <div className="live-preview" style={{ backgroundColor: editedRule.format.value || 'transparent', color: editedRule.format.textColor || 'inherit', fontWeight: editedRule.format.fontWeight || 'normal', fontStyle: editedRule.format.fontStyle || 'normal' }}>
              This is how matching cells will look
            </div>
          </div>
        </div>

        <div className="editor-actions">
          <button onClick={onCancel} className="btn-cancel">Cancel</button>
          <button onClick={handleSave} className="btn-save">Save Rule</button>
        </div>
      </div>
    </div>
  )
}

export default RuleEditor
