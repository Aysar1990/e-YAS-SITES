# Phase 4: Formatting & AI Suggestions

## 🎯 **الأهداف:**
1. ✅ Conditional Formatting - تنسيق شرطي
2. ✅ Smart Suggestions - اقتراحات ذكية

---

## 📁 **الملفات المتأثرة:**

```
src/pages/Admin/SpreadsheetView/
├── SpreadsheetView.jsx          [MODIFY - Add formatting & suggestions]
├── SpreadsheetView.css          [MODIFY - Add suggestion styles]
├── components/
│   ├── FormattingRules.jsx      [NEW - Conditional formatting]
│   └── SuggestionsPanel.jsx     [NEW - Smart suggestions]
├── hooks/
│   └── useSmartSuggestions.js   [NEW - AI suggestions]
└── utils/
    └── formattingRules.js       [NEW - Formatting logic]
```

---

## 🛠️ **التنفيذ:**

### **1. Conditional Formatting** 🎨

#### **File: utils/formattingRules.js**
```javascript
/**
 * Conditional formatting rules engine
 */

export const ruleTypes = {
  TEXT_CONTAINS: 'text_contains',
  TEXT_EQUALS: 'text_equals',
  NUMBER_GREATER: 'number_greater',
  NUMBER_LESS: 'number_less',
  NUMBER_BETWEEN: 'number_between',
  DATE_BEFORE: 'date_before',
  DATE_AFTER: 'date_after',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  CUSTOM: 'custom'
}

export const formatTypes = {
  BACKGROUND: 'background',
  TEXT_COLOR: 'text_color',
  FONT_WEIGHT: 'font_weight',
  FONT_STYLE: 'font_style',
  BORDER: 'border',
  ICON: 'icon'
}

export const defaultRules = [
  {
    id: 'approved_green',
    name: 'Approved Status → Green',
    enabled: true,
    field: 'tssr_overall_status',
    condition: {
      type: ruleTypes.TEXT_EQUALS,
      value: 'Approved'
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(76, 175, 80, 0.2)',
      textColor: '#4CAF50',
      fontWeight: 'bold'
    },
    priority: 1
  },
  {
    id: 'pending_yellow',
    name: 'Pending Status → Yellow',
    enabled: true,
    field: null, // Apply to any field
    condition: {
      type: ruleTypes.TEXT_CONTAINS,
      value: 'pending'
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(255, 193, 7, 0.2)',
      textColor: '#FFC107'
    },
    priority: 2
  },
  {
    id: 'rejected_red',
    name: 'Rejected → Red',
    enabled: true,
    field: null,
    condition: {
      type: ruleTypes.TEXT_EQUALS,
      value: 'Rejected'
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(244, 67, 54, 0.2)',
      textColor: '#F44336',
      fontWeight: 'bold'
    },
    priority: 1
  },
  {
    id: 'old_action_age',
    name: 'Action Age > 30 days → Orange',
    enabled: true,
    field: 'action_age',
    condition: {
      type: ruleTypes.NUMBER_GREATER,
      value: 30
    },
    format: {
      type: formatTypes.BACKGROUND,
      value: 'rgba(255, 152, 0, 0.2)',
      textColor: '#FF9800',
      fontWeight: 'bold'
    },
    priority: 3
  },
  {
    id: 'high_priority',
    name: 'High Priority → Bold',
    enabled: true,
    field: 'priority',
    condition: {
      type: ruleTypes.TEXT_EQUALS,
      value: 'High'
    },
    format: {
      type: formatTypes.FONT_WEIGHT,
      fontWeight: 'bold',
      textColor: '#FF5722'
    },
    priority: 4
  }
]

export const evaluateRule = (value, condition) => {
  if (value == null && condition.type !== ruleTypes.IS_EMPTY) return false
  
  switch (condition.type) {
    case ruleTypes.TEXT_CONTAINS:
      return String(value).toLowerCase().includes(String(condition.value).toLowerCase())
    
    case ruleTypes.TEXT_EQUALS:
      return String(value).toLowerCase() === String(condition.value).toLowerCase()
    
    case ruleTypes.NUMBER_GREATER:
      return Number(value) > Number(condition.value)
    
    case ruleTypes.NUMBER_LESS:
      return Number(value) < Number(condition.value)
    
    case ruleTypes.NUMBER_BETWEEN:
      const num = Number(value)
      return num >= Number(condition.min) && num <= Number(condition.max)
    
    case ruleTypes.IS_EMPTY:
      return value == null || String(value).trim() === ''
    
    case ruleTypes.IS_NOT_EMPTY:
      return value != null && String(value).trim() !== ''
    
    case ruleTypes.CUSTOM:
      try {
        // Evaluate custom function
        return condition.fn(value)
      } catch {
        return false
      }
    
    default:
      return false
  }
}

export const applyFormattingRules = (value, field, rules) => {
  const styles = {}
  
  // Filter and sort rules by priority
  const applicableRules = rules
    .filter(rule => rule.enabled)
    .filter(rule => !rule.field || rule.field === field)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
  
  // Apply rules in priority order
  for (const rule of applicableRules) {
    if (evaluateRule(value, rule.condition)) {
      Object.assign(styles, {
        backgroundColor: rule.format.value,
        color: rule.format.textColor,
        fontWeight: rule.format.fontWeight,
        fontStyle: rule.format.fontStyle,
        border: rule.format.border
      })
    }
  }
  
  return styles
}

export const saveRulesToStorage = (rules) => {
  try {
    localStorage.setItem('spreadsheet_formatting_rules', JSON.stringify(rules))
  } catch (error) {
    console.error('Failed to save rules:', error)
  }
}

export const loadRulesFromStorage = () => {
  try {
    const stored = localStorage.getItem('spreadsheet_formatting_rules')
    return stored ? JSON.parse(stored) : defaultRules
  } catch {
    return defaultRules
  }
}
```

#### **File: components/FormattingRules.jsx**
```jsx
import React, { useState } from 'react'
import { ruleTypes, formatTypes, saveRulesToStorage } from '../utils/formattingRules'
import './FormattingRules.css'

const FormattingRules = ({ rules, onUpdateRules, onClose }) => {
  const [editingRule, setEditingRule] = useState(null)
  
  const toggleRule = (ruleId) => {
    const updated = rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    )
    onUpdateRules(updated)
    saveRulesToStorage(updated)
  }
  
  const deleteRule = (ruleId) => {
    if (window.confirm('Delete this rule?')) {
      const updated = rules.filter(r => r.id !== ruleId)
      onUpdateRules(updated)
      saveRulesToStorage(updated)
    }
  }
  
  const addNewRule = () => {
    const newRule = {
      id: `rule_${Date.now()}`,
      name: 'New Rule',
      enabled: true,
      field: null,
      condition: {
        type: ruleTypes.TEXT_CONTAINS,
        value: ''
      },
      format: {
        type: formatTypes.BACKGROUND,
        value: 'rgba(143, 217, 217, 0.2)',
        textColor: '#8FD9D9'
      },
      priority: rules.length + 1
    }
    
    const updated = [...rules, newRule]
    onUpdateRules(updated)
    setEditingRule(newRule.id)
  }
  
  return (
    <div className="formatting-rules-panel">
      <div className="panel-header">
        <h3>🎨 Conditional Formatting</h3>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>
      
      <div className="rules-list">
        {rules.map(rule => (
          <div key={rule.id} className="rule-item">
            <div className="rule-header">
              <label className="rule-toggle">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleRule(rule.id)}
                />
                <span className="rule-name">{rule.name}</span>
              </label>
              
              <div className="rule-actions">
                <button
                  className="btn-edit"
                  onClick={() => setEditingRule(rule.id)}
                  title="Edit rule"
                >
                  ✏️
                </button>
                <button
                  className="btn-delete"
                  onClick={() => deleteRule(rule.id)}
                  title="Delete rule"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="rule-preview">
              <span className="preview-label">Preview:</span>
              <span 
                className="preview-sample"
                style={{
                  backgroundColor: rule.format.value,
                  color: rule.format.textColor,
                  fontWeight: rule.format.fontWeight
                }}
              >
                Sample Text
              </span>
            </div>
            
            <div className="rule-description">
              {rule.field && <span className="field-badge">{rule.field}</span>}
              <span className="condition-text">
                {rule.condition.type} "{rule.condition.value}"
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="panel-footer">
        <button onClick={addNewRule} className="btn-add-rule">
          ➕ Add New Rule
        </button>
      </div>
      
      {editingRule && (
        <RuleEditor
          rule={rules.find(r => r.id === editingRule)}
          onSave={(updated) => {
            const newRules = rules.map(r => r.id === editingRule ? updated : r)
            onUpdateRules(newRules)
            saveRulesToStorage(newRules)
            setEditingRule(null)
          }}
          onCancel={() => setEditingRule(null)}
        />
      )}
    </div>
  )
}

const RuleEditor = ({ rule, onSave, onCancel }) => {
  const [editedRule, setEditedRule] = useState({ ...rule })
  
  return (
    <div className="rule-editor-overlay">
      <div className="rule-editor">
        <h4>Edit Rule</h4>
        
        <div className="editor-field">
          <label>Rule Name</label>
          <input
            type="text"
            value={editedRule.name}
            onChange={(e) => setEditedRule({ ...editedRule, name: e.target.value })}
          />
        </div>
        
        <div className="editor-field">
          <label>Field (leave empty for any field)</label>
          <input
            type="text"
            value={editedRule.field || ''}
            onChange={(e) => setEditedRule({ ...editedRule, field: e.target.value || null })}
            placeholder="e.g., tssr_overall_status"
          />
        </div>
        
        <div className="editor-field">
          <label>Condition Type</label>
          <select
            value={editedRule.condition.type}
            onChange={(e) => setEditedRule({
              ...editedRule,
              condition: { ...editedRule.condition, type: e.target.value }
            })}
          >
            <option value={ruleTypes.TEXT_CONTAINS}>Text Contains</option>
            <option value={ruleTypes.TEXT_EQUALS}>Text Equals</option>
            <option value={ruleTypes.NUMBER_GREATER}>Number Greater Than</option>
            <option value={ruleTypes.NUMBER_LESS}>Number Less Than</option>
            <option value={ruleTypes.IS_EMPTY}>Is Empty</option>
            <option value={ruleTypes.IS_NOT_EMPTY}>Is Not Empty</option>
          </select>
        </div>
        
        <div className="editor-field">
          <label>Condition Value</label>
          <input
            type="text"
            value={editedRule.condition.value || ''}
            onChange={(e) => setEditedRule({
              ...editedRule,
              condition: { ...editedRule.condition, value: e.target.value }
            })}
          />
        </div>
        
        <div className="editor-field">
          <label>Background Color</label>
          <input
            type="color"
            value={editedRule.format.value?.match(/#[0-9A-F]{6}/i)?.[0] || '#8FD9D9'}
            onChange={(e) => setEditedRule({
              ...editedRule,
              format: { ...editedRule.format, value: `${e.target.value}33` } // Add transparency
            })}
          />
        </div>
        
        <div className="editor-field">
          <label>Text Color</label>
          <input
            type="color"
            value={editedRule.format.textColor || '#8FD9D9'}
            onChange={(e) => setEditedRule({
              ...editedRule,
              format: { ...editedRule.format, textColor: e.target.value }
            })}
          />
        </div>
        
        <div className="editor-actions">
          <button onClick={onCancel} className="btn-cancel">Cancel</button>
          <button onClick={() => onSave(editedRule)} className="btn-save">Save</button>
        </div>
      </div>
    </div>
  )
}

export default FormattingRules
```

---

### **2. Smart Suggestions** 🤖

#### **File: hooks/useSmartSuggestions.js**
```javascript
import { useState, useEffect, useMemo } from 'react'

export const useSmartSuggestions = (data) => {
  const [suggestions, setSuggestions] = useState([])
  const [dismissed, setDismissed] = useState([])
  
  // Calculate suggestions from data
  const calculatedSuggestions = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const newSuggestions = []
    
    // 1. Sites pending for too long
    const oldPending = data.filter(site => 
      site.tssr_overall_status?.toLowerCase().includes('pending') &&
      site.action_age > 15
    )
    
    if (oldPending.length > 0) {
      newSuggestions.push({
        id: 'old_pending',
        type: 'warning',
        icon: '⚠️',
        title: `${oldPending.length} sites pending > 15 days`,
        description: `These sites require attention`,
        action: {
          label: 'View Sites',
          filter: { tssr_overall_status: 'Pending', action_age_min: 15 }
        },
        priority: 1
      })
    }
    
    // 2. High approval rate contractor
    const contractorStats = {}
    data.forEach(site => {
      const contractor = site.tssr_subcon
      if (!contractor) return
      
      if (!contractorStats[contractor]) {
        contractorStats[contractor] = { total: 0, approved: 0 }
      }
      
      contractorStats[contractor].total++
      if (site.tssr_overall_status === 'Approved') {
        contractorStats[contractor].approved++
      }
    })
    
    const bestContractor = Object.entries(contractorStats)
      .map(([name, stats]) => ({
        name,
        rate: (stats.approved / stats.total * 100).toFixed(1),
        total: stats.total
      }))
      .filter(c => c.total >= 10)
      .sort((a, b) => b.rate - a.rate)[0]
    
    if (bestContractor && bestContractor.rate > 80) {
      newSuggestions.push({
        id: 'best_contractor',
        type: 'success',
        icon: '⭐',
        title: `${bestContractor.name} has ${bestContractor.rate}% approval rate`,
        description: `Excellent performance on ${bestContractor.total} sites`,
        action: null,
        priority: 4
      })
    }
    
    // 3. Governorate completion
    const govStats = {}
    data.forEach(site => {
      const gov = site.governorate
      if (!gov) return
      
      if (!govStats[gov]) {
        govStats[gov] = { total: 0, approved: 0 }
      }
      
      govStats[gov].total++
      if (site.tssr_overall_status === 'Approved') {
        govStats[gov].approved++
      }
    })
    
    const nearComplete = Object.entries(govStats)
      .map(([name, stats]) => ({
        name,
        rate: (stats.approved / stats.total * 100).toFixed(1),
        remaining: stats.total - stats.approved
      }))
      .filter(g => g.rate >= 90 && g.remaining > 0)
    
    nearComplete.forEach(gov => {
      newSuggestions.push({
        id: `gov_complete_${gov.name}`,
        type: 'info',
        icon: '📍',
        title: `${gov.name} is ${gov.rate}% complete`,
        description: `Only ${gov.remaining} sites remaining`,
        action: {
          label: 'View Remaining',
          filter: { governorate: gov.name, tssr_overall_status_not: 'Approved' }
        },
        priority: 3
      })
    })
    
    // 4. Department bottleneck
    const deptFields = ['ti_status', 'rf_plan_status', 'rf_optim_status', 'civil_status']
    const deptStats = {}
    
    deptFields.forEach(field => {
      const pending = data.filter(site => 
        site[field]?.toLowerCase().includes('pending')
      ).length
      
      if (pending > 20) {
        deptStats[field] = pending
      }
    })
    
    const maxDept = Object.entries(deptStats)
      .sort((a, b) => b[1] - a[1])[0]
    
    if (maxDept) {
      newSuggestions.push({
        id: 'dept_bottleneck',
        type: 'warning',
        icon: '🚧',
        title: `${maxDept[0].replace('_', ' ')} has ${maxDept[1]} pending`,
        description: `This department may need attention`,
        action: null,
        priority: 2
      })
    }
    
    // 5. Duplicate detection
    const siteNames = {}
    data.forEach(site => {
      const name = site.final_site_name
      if (name) {
        siteNames[name] = (siteNames[name] || 0) + 1
      }
    })
    
    const duplicates = Object.entries(siteNames)
      .filter(([_, count]) => count > 1)
    
    if (duplicates.length > 0) {
      newSuggestions.push({
        id: 'duplicates',
        type: 'error',
        icon: '⚠️',
        title: `${duplicates.length} potential duplicate site names`,
        description: `Review and verify these entries`,
        action: null,
        priority: 1
      })
    }
    
    return newSuggestions.sort((a, b) => a.priority - b.priority)
  }, [data])
  
  // Filter out dismissed suggestions
  useEffect(() => {
    const active = calculatedSuggestions.filter(s => !dismissed.includes(s.id))
    setSuggestions(active)
  }, [calculatedSuggestions, dismissed])
  
  const dismissSuggestion = (id) => {
    setDismissed(prev => [...prev, id])
  }
  
  const clearDismissed = () => {
    setDismissed([])
  }
  
  return {
    suggestions,
    dismissSuggestion,
    clearDismissed,
    hasNew: suggestions.length > 0
  }
}
```

#### **File: components/SuggestionsPanel.jsx**
```jsx
import React from 'react'
import './SuggestionsPanel.css'

const SuggestionsPanel = ({ suggestions, onDismiss, onAction, onClose }) => {
  const getTypeClass = (type) => {
    switch (type) {
      case 'success': return 'suggestion-success'
      case 'warning': return 'suggestion-warning'
      case 'error': return 'suggestion-error'
      default: return 'suggestion-info'
    }
  }
  
  return (
    <div className="suggestions-panel">
      <div className="panel-header">
        <h3>🤖 Smart Suggestions</h3>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>
      
      <div className="suggestions-list">
        {suggestions.length === 0 ? (
          <div className="empty-suggestions">
            <span className="empty-icon">✨</span>
            <p>No suggestions at the moment</p>
            <small>Check back later for insights</small>
          </div>
        ) : (
          suggestions.map(suggestion => (
            <div key={suggestion.id} className={`suggestion-item ${getTypeClass(suggestion.type)}`}>
              <div className="suggestion-header">
                <span className="suggestion-icon">{suggestion.icon}</span>
                <h4 className="suggestion-title">{suggestion.title}</h4>
                <button
                  className="btn-dismiss"
                  onClick={() => onDismiss(suggestion.id)}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
              
              <p className="suggestion-description">{suggestion.description}</p>
              
              {suggestion.action && (
                <button
                  className="suggestion-action"
                  onClick={() => onAction(suggestion.action.filter)}
                >
                  {suggestion.action.label} →
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SuggestionsPanel
```

#### **File: components/SuggestionsPanel.css**
```css
.suggestions-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  max-height: 500px;
  background: #141e30;
  border: 1px solid rgba(143, 217, 217, 0.3);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.suggestions-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.empty-suggestions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 10px;
}

.empty-suggestions p {
  margin: 5px 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.empty-suggestions small {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.suggestion-item {
  background: rgba(143, 217, 217, 0.05);
  border-left: 4px solid var(--primary-color);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  transition: all 0.2s ease;
}

.suggestion-item:hover {
  background: rgba(143, 217, 217, 0.1);
}

.suggestion-success { border-left-color: #4CAF50; }
.suggestion-warning { border-left-color: #FFC107; }
.suggestion-error { border-left-color: #F44336; }
.suggestion-info { border-left-color: var(--primary-color); }

.suggestion-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.suggestion-icon {
  font-size: 1.3rem;
}

.suggestion-title {
  flex: 1;
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.btn-dismiss {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-dismiss:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.suggestion-description {
  margin: 0 0 10px 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

.suggestion-action {
  padding: 6px 12px;
  background: rgba(143, 217, 217, 0.15);
  border: 1px solid rgba(143, 217, 217, 0.3);
  border-radius: 6px;
  color: var(--primary-color);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-action:hover {
  background: rgba(143, 217, 217, 0.25);
  transform: translateX(2px);
}
```

---

## ✅ **Testing Checklist:**

### **Conditional Formatting:**
- [ ] Default rules apply correctly
- [ ] Can create custom rules
- [ ] Can edit existing rules
- [ ] Can delete rules
- [ ] Rules save to localStorage
- [ ] Rule priority works
- [ ] Toggle rule on/off works
- [ ] Preview shows correct formatting

### **Smart Suggestions:**
- [ ] Detects old pending sites
- [ ] Identifies high-performing contractors
- [ ] Shows governorate completion
- [ ] Detects department bottlenecks
- [ ] Finds duplicate site names
- [ ] Dismiss suggestion works
- [ ] Suggestions update with data changes
- [ ] Action buttons filter grid correctly

---

## 🎯 **Claude Code Instructions:**

```
PHASE 4 IMPLEMENTATION - FINAL PHASE:

1. CREATE files:
   - utils/formattingRules.js
   - hooks/useSmartSuggestions.js
   - components/FormattingRules.jsx + .css
   - components/SuggestionsPanel.jsx + .css

2. MODIFY SpreadsheetView.jsx:
   - Import formatting and suggestions
   - Add formatting rules state
   - Apply formatting to cellStyle
   - Add suggestions panel toggle
   - Wire up suggestion actions to grid filters

3. INTEGRATION:
   - Load formatting rules from localStorage
   - Calculate suggestions on data change
   - Apply formatting rules to all cells
   - Show/hide panels with toolbar buttons

COMPLEXITY: High (AI logic + dynamic styling)
TIME: 90 minutes
FINAL FEATURES: All 9 enhancements complete!
```

---

## 🎉 **المراحل الأربعة - ملخص:**

| المرحلة | الميزات | الوقت | الصعوبة |
|--------|---------|-------|---------|
| **Phase 1** | Stats Widget, Freeze Columns, Recent Changes | 45min | سهل |
| **Phase 2** | Smart Search, Saved Views | 60min | متوسط |
| **Phase 3** | Export Options, Cell History | 70min | متوسط+ |
| **Phase 4** | Conditional Formatting, Smart Suggestions | 90min | صعب |
| **المجموع** | **9 ميزات** | **~4.5 ساعات** | **متدرج** |

---

**🚀 الآن كل شيء جاهز! ابدأ بـ Phase 1 واعمل تدريجياً!**
