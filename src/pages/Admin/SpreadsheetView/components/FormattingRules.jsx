/**
 * Formatting Rules Panel Component V2.0
 * REFACTORED: Extracted RuleEditor to separate file
 * Original: 521 lines → Refactored: ~180 lines
 */

import { useState, useCallback } from 'react'
import { ruleTypeLabels, ruleTypes, saveRulesToStorage, createEmptyRule, resetToDefaults } from '../utils/formattingRules'
import RuleEditor from './RuleEditor'
import './FormattingRules.css'

const FormattingRules = ({ rules, onUpdateRules, onClose, columns = [] }) => {
  const [editingRule, setEditingRule] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const toggleRule = useCallback((ruleId) => {
    const updated = rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
    onUpdateRules(updated)
    saveRulesToStorage(updated)
  }, [rules, onUpdateRules])

  const deleteRule = useCallback((ruleId) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule?.isDefault) {
      alert('Cannot delete default rules. You can disable them instead.')
      return
    }
    if (window.confirm('Delete this formatting rule?')) {
      const updated = rules.filter(r => r.id !== ruleId)
      onUpdateRules(updated)
      saveRulesToStorage(updated)
    }
  }, [rules, onUpdateRules])

  const addNewRule = useCallback(() => {
    const newRule = createEmptyRule()
    onUpdateRules([...rules, newRule])
    setEditingRule(newRule.id)
  }, [rules, onUpdateRules])

  const handleSaveRule = useCallback((updatedRule) => {
    const newRules = rules.map(r => r.id === editingRule ? updatedRule : r)
    onUpdateRules(newRules)
    saveRulesToStorage(newRules)
    setEditingRule(null)
  }, [rules, editingRule, onUpdateRules])

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all formatting rules to defaults? Custom rules will be deleted.')) {
      onUpdateRules(resetToDefaults())
    }
  }, [onUpdateRules])

  const moveRule = useCallback((ruleId, direction) => {
    const index = rules.findIndex(r => r.id === ruleId)
    if (index === -1) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= rules.length) return
    const updated = [...rules]
    const [removed] = updated.splice(index, 1)
    updated.splice(newIndex, 0, removed)
    const reIndexed = updated.map((r, i) => ({ ...r, priority: i + 1 }))
    onUpdateRules(reIndexed)
    saveRulesToStorage(reIndexed)
  }, [rules, onUpdateRules])

  const filteredRules = rules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.field?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.condition.value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )

  const enabledCount = rules.filter(r => r.enabled).length

  return (
    <div className="formatting-rules-panel">
      <div className="panel-header">
        <div className="header-title">
          <span className="header-icon">🎨</span>
          <h3>Conditional Formatting</h3>
        </div>
        <div className="header-stats">
          <span className="stat-badge">{enabledCount}/{rules.length} active</span>
        </div>
        <button onClick={onClose} className="btn-close" title="Close">✕</button>
      </div>

      <div className="panel-search">
        <input type="text" placeholder="Search rules..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
      </div>

      <div className="rules-list">
        {filteredRules.length === 0 ? (
          <div className="empty-rules"><span className="empty-icon">📋</span><p>No rules found</p></div>
        ) : (
          filteredRules.map((rule, index) => (
            <div key={rule.id} className={`rule-item ${rule.enabled ? 'enabled' : 'disabled'} ${rule.isDefault ? 'default' : 'custom'}`}>
              <div className="rule-header">
                <label className="rule-toggle">
                  <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                  <span className="toggle-slider"></span>
                </label>
                <div className="rule-info">
                  <span className="rule-name">{rule.name}</span>
                  {rule.isDefault && <span className="default-badge">Default</span>}
                </div>
                <div className="rule-actions">
                  <button className="btn-action btn-up" onClick={() => moveRule(rule.id, 'up')} disabled={index === 0} title="Move up">↑</button>
                  <button className="btn-action btn-down" onClick={() => moveRule(rule.id, 'down')} disabled={index === filteredRules.length - 1} title="Move down">↓</button>
                  <button className="btn-action btn-edit" onClick={() => setEditingRule(rule.id)} title="Edit rule">✏️</button>
                  <button className="btn-action btn-delete" onClick={() => deleteRule(rule.id)} disabled={rule.isDefault} title={rule.isDefault ? 'Cannot delete default rules' : 'Delete rule'}>🗑️</button>
                </div>
              </div>
              <div className="rule-details">
                <div className="rule-preview">
                  <span className="preview-label">Preview:</span>
                  <span className="preview-sample" style={{ backgroundColor: rule.format.value || 'transparent', color: rule.format.textColor || 'inherit', fontWeight: rule.format.fontWeight || 'normal', fontStyle: rule.format.fontStyle || 'normal' }}>Sample Text</span>
                </div>
                <div className="rule-description">
                  {rule.field ? <span className="field-badge" title="Applies to this field only">📊 {rule.field}</span> : <span className="field-badge global" title="Applies to all fields">🌐 All fields</span>}
                  <span className="condition-text">
                    {ruleTypeLabels[rule.condition.type] || rule.condition.type}
                    {rule.condition.value && ` "${rule.condition.value}"`}
                    {rule.condition.type === ruleTypes.NUMBER_BETWEEN && ` ${rule.condition.min} - ${rule.condition.max}`}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="panel-footer">
        <button onClick={addNewRule} className="btn-add-rule">➕ Add New Rule</button>
        <button onClick={handleReset} className="btn-reset" title="Reset to default rules">🔄 Reset</button>
      </div>

      {editingRule && (
        <RuleEditor rule={rules.find(r => r.id === editingRule)} columns={columns} onSave={handleSaveRule} onCancel={() => setEditingRule(null)} />
      )}
    </div>
  )
}

export default FormattingRules
