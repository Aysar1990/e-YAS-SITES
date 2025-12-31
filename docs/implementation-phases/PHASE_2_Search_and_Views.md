# Phase 2: Search & Views Management

## 🎯 **الأهداف:**
1. ✅ Smart Search - بحث ذكي متقدم
2. ✅ Saved Views/Presets - حفظ الإعدادات

---

## 📁 **الملفات المتأثرة:**

```
src/pages/Admin/SpreadsheetView/
├── SpreadsheetView.jsx          [MODIFY - Add search & views]
├── SpreadsheetView.css          [MODIFY - Add search styles]
├── components/
│   ├── SmartSearch.jsx          [NEW - Advanced search]
│   └── ViewsManager.jsx         [NEW - Saved views]
├── hooks/
│   └── useSavedViews.js         [NEW - LocalStorage views]
└── utils/
    └── searchUtils.js           [NEW - Search helpers]
```

---

## 🛠️ **التنفيذ:**

### **1. Smart Search** 🔍

#### **File: utils/searchUtils.js**
```javascript
/**
 * Advanced search utilities
 */

export const searchModes = {
  SIMPLE: 'simple',      // Basic text search
  REGEX: 'regex',        // Regular expression
  EXACT: 'exact',        // Exact match
  MULTI: 'multi'         // Multiple terms (AND/OR)
}

export const performSearch = (data, query, mode = searchModes.SIMPLE, columns = null) => {
  if (!query || query.trim() === '') return data
  
  const searchQuery = query.trim()
  
  switch (mode) {
    case searchModes.REGEX:
      return searchByRegex(data, searchQuery, columns)
    
    case searchModes.EXACT:
      return searchExact(data, searchQuery, columns)
    
    case searchModes.MULTI:
      return searchMulti(data, searchQuery, columns)
    
    case searchModes.SIMPLE:
    default:
      return searchSimple(data, searchQuery, columns)
  }
}

const searchSimple = (data, query, columns) => {
  const lowerQuery = query.toLowerCase()
  
  return data.filter(row => {
    const fieldsToSearch = columns || Object.keys(row)
    
    return fieldsToSearch.some(field => {
      const value = row[field]
      if (value == null) return false
      return String(value).toLowerCase().includes(lowerQuery)
    })
  })
}

const searchExact = (data, query, columns) => {
  return data.filter(row => {
    const fieldsToSearch = columns || Object.keys(row)
    
    return fieldsToSearch.some(field => {
      const value = row[field]
      if (value == null) return false
      return String(value) === query
    })
  })
}

const searchByRegex = (data, pattern, columns) => {
  try {
    const regex = new RegExp(pattern, 'i')
    
    return data.filter(row => {
      const fieldsToSearch = columns || Object.keys(row)
      
      return fieldsToSearch.some(field => {
        const value = row[field]
        if (value == null) return false
        return regex.test(String(value))
      })
    })
  } catch (error) {
    console.error('Invalid regex pattern:', error)
    return data
  }
}

const searchMulti = (data, query, columns) => {
  // Parse query: "term1 AND term2" or "term1 OR term2"
  const hasAND = query.includes(' AND ')
  const hasOR = query.includes(' OR ')
  
  if (!hasAND && !hasOR) {
    // No operators, treat as simple search
    return searchSimple(data, query, columns)
  }
  
  const operator = hasAND ? 'AND' : 'OR'
  const terms = query.split(` ${operator} `).map(t => t.trim().toLowerCase())
  
  return data.filter(row => {
    const fieldsToSearch = columns || Object.keys(row)
    const rowText = fieldsToSearch
      .map(field => String(row[field] || ''))
      .join(' ')
      .toLowerCase()
    
    if (operator === 'AND') {
      return terms.every(term => rowText.includes(term))
    } else {
      return terms.some(term => rowText.includes(term))
    }
  })
}

export const highlightMatches = (text, query, mode = searchModes.SIMPLE) => {
  if (!query || !text) return text
  
  try {
    if (mode === searchModes.REGEX) {
      const regex = new RegExp(`(${query})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    } else {
      const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    }
  } catch {
    return text
  }
}

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const saveSearchHistory = (query) => {
  const history = getSearchHistory()
  const updated = [query, ...history.filter(q => q !== query)].slice(0, 10)
  localStorage.setItem('spreadsheet_search_history', JSON.stringify(updated))
}

export const getSearchHistory = () => {
  try {
    const history = localStorage.getItem('spreadsheet_search_history')
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

export const clearSearchHistory = () => {
  localStorage.removeItem('spreadsheet_search_history')
}
```

#### **File: components/SmartSearch.jsx**
```jsx
import React, { useState, useEffect, useRef } from 'react'
import { searchModes, performSearch, saveSearchHistory, getSearchHistory } from '../utils/searchUtils'
import './SmartSearch.css'

const SmartSearch = ({ data, onSearchResults, columns }) => {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState(searchModes.SIMPLE)
  const [selectedColumns, setSelectedColumns] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [matchCount, setMatchCount] = useState(null)
  const inputRef = useRef(null)
  
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])
  
  useEffect(() => {
    if (!query) {
      onSearchResults(data, null)
      setMatchCount(null)
      return
    }
    
    const searchColumns = selectedColumns.length > 0 ? selectedColumns : null
    const results = performSearch(data, query, mode, searchColumns)
    
    onSearchResults(results, query)
    setMatchCount(results.length)
    
    // Save to history on successful search
    if (results.length > 0 && query.length > 2) {
      saveSearchHistory(query)
    }
  }, [query, mode, selectedColumns, data])
  
  const handleHistoryClick = (historyQuery) => {
    setQuery(historyQuery)
    setShowHistory(false)
    inputRef.current?.focus()
  }
  
  const clearSearch = () => {
    setQuery('')
    setMatchCount(null)
    inputRef.current?.focus()
  }
  
  return (
    <div className="smart-search">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Smart search across all columns..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 200)}
        />
        
        {query && (
          <button className="clear-search" onClick={clearSearch}>
            ✕
          </button>
        )}
        
        {matchCount !== null && (
          <span className="match-count">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>
      
      <div className="search-modes">
        <button
          className={`mode-btn ${mode === searchModes.SIMPLE ? 'active' : ''}`}
          onClick={() => setMode(searchModes.SIMPLE)}
          title="Simple text search"
        >
          Simple
        </button>
        <button
          className={`mode-btn ${mode === searchModes.EXACT ? 'active' : ''}`}
          onClick={() => setMode(searchModes.EXACT)}
          title="Exact match"
        >
          Exact
        </button>
        <button
          className={`mode-btn ${mode === searchModes.REGEX ? 'active' : ''}`}
          onClick={() => setMode(searchModes.REGEX)}
          title="Regular expression"
        >
          Regex
        </button>
        <button
          className={`mode-btn ${mode === searchModes.MULTI ? 'active' : ''}`}
          onClick={() => setMode(searchModes.MULTI)}
          title="Multiple terms (AND/OR)"
        >
          Multi
        </button>
      </div>
      
      {showHistory && searchHistory.length > 0 && (
        <div className="search-history">
          <div className="history-header">Recent Searches</div>
          {searchHistory.map((item, idx) => (
            <div
              key={idx}
              className="history-item"
              onClick={() => handleHistoryClick(item)}
            >
              <span className="history-icon">🕐</span>
              <span className="history-text">{item}</span>
            </div>
          ))}
        </div>
      )}
      
      {mode === searchModes.MULTI && (
        <div className="search-help">
          <small>💡 Use "term1 AND term2" or "term1 OR term2"</small>
        </div>
      )}
      
      {mode === searchModes.REGEX && (
        <div className="search-help">
          <small>💡 Example: "^421.*" for sites starting with 421</small>
        </div>
      )}
    </div>
  )
}

export default SmartSearch
```

#### **File: components/SmartSearch.css**
```css
.smart-search {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 400px;
  position: relative;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(143, 217, 217, 0.08);
  border: 1px solid rgba(143, 217, 217, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
  transition: all 0.3s ease;
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-color);
  background: rgba(143, 217, 217, 0.12);
  box-shadow: 0 0 0 3px rgba(143, 217, 217, 0.15);
}

.search-icon {
  font-size: 1.1rem;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.clear-search {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0 4px;
  transition: all 0.2s ease;
}

.clear-search:hover {
  color: var(--accent-color);
}

.match-count {
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 600;
  white-space: nowrap;
}

.search-modes {
  display: flex;
  gap: 6px;
}

.mode-btn {
  padding: 6px 12px;
  background: rgba(143, 217, 217, 0.05);
  border: 1px solid rgba(143, 217, 217, 0.2);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  background: rgba(143, 217, 217, 0.15);
  color: var(--text-primary);
}

.mode-btn.active {
  background: var(--primary-color);
  color: #0a0e1a;
  border-color: var(--primary-color);
  font-weight: 600;
}

.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #141e30;
  border: 1px solid rgba(143, 217, 217, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.history-header {
  padding: 8px 12px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(143, 217, 217, 0.1);
  font-weight: 600;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: rgba(143, 217, 217, 0.1);
}

.history-icon {
  opacity: 0.5;
  font-size: 0.9rem;
}

.history-text {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.search-help {
  padding: 6px 10px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
}

.search-help small {
  color: rgba(255, 193, 7, 0.9);
  font-size: 0.75rem;
}
```

---

### **2. Saved Views/Presets** 💾

#### **File: hooks/useSavedViews.js**
```javascript
import { useState, useEffect, useCallback } from 'react'

const VIEWS_STORAGE_KEY = 'spreadsheet_saved_views'

const defaultViews = [
  {
    id: 'essential',
    name: 'Essential View',
    icon: '⭐',
    config: {
      visibleColumns: ['site_id', 'final_site_name', 'governorate', 'tssr_overall_status', 
                       'ti_status', 'rf_plan_status', 'rf_optim_status', 'civil_status'],
      density: 'compact',
      filters: null,
      sort: null,
      pinnedColumns: ['site_id']
    },
    isDefault: true
  },
  {
    id: 'nokia_review',
    name: 'Nokia Review',
    icon: '📱',
    config: {
      visibleColumns: ['site_id', 'final_site_name', 'nokia_npo_status', 'nokia_npo_comment', 
                       'nokia_site_owner', 'tssr_overall_status'],
      density: 'comfortable',
      filters: { tssr_overall_status: 'Under Nokia' },
      sort: { field: 'nokia_npo_status', order: 'asc' },
      pinnedColumns: ['site_id', 'final_site_name']
    },
    isDefault: true
  },
  {
    id: 'pending_review',
    name: 'Pending Review',
    icon: '⏳',
    config: {
      visibleColumns: ['site_id', 'final_site_name', 'tssr_overall_status', 'tssr_status_date',
                       'ti_status', 'rf_plan_status', 'rf_optim_status', 'civil_status', 'action_age'],
      density: 'compact',
      filters: { tssr_overall_status: 'Pending' },
      sort: { field: 'action_age', order: 'desc' },
      pinnedColumns: ['site_id']
    },
    isDefault: true
  }
]

export const useSavedViews = () => {
  const [views, setViews] = useState([])
  const [currentView, setCurrentView] = useState(null)
  
  // Load views from localStorage
  useEffect(() => {
    const loadViews = () => {
      try {
        const stored = localStorage.getItem(VIEWS_STORAGE_KEY)
        const customViews = stored ? JSON.parse(stored) : []
        setViews([...defaultViews, ...customViews])
      } catch (error) {
        console.error('Failed to load saved views:', error)
        setViews(defaultViews)
      }
    }
    
    loadViews()
  }, [])
  
  // Save custom views to localStorage
  const saveToStorage = useCallback((customViews) => {
    try {
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(customViews))
    } catch (error) {
      console.error('Failed to save views:', error)
    }
  }, [])
  
  // Create new view
  const createView = useCallback((name, config, icon = '📌') => {
    const newView = {
      id: `custom_${Date.now()}`,
      name,
      icon,
      config,
      isDefault: false,
      createdAt: new Date().toISOString()
    }
    
    setViews(prev => {
      const updated = [...prev, newView]
      const customViews = updated.filter(v => !v.isDefault)
      saveToStorage(customViews)
      return updated
    })
    
    return newView
  }, [saveToStorage])
  
  // Update existing view
  const updateView = useCallback((viewId, updates) => {
    setViews(prev => {
      const updated = prev.map(v => 
        v.id === viewId ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
      )
      const customViews = updated.filter(v => !v.isDefault)
      saveToStorage(customViews)
      return updated
    })
  }, [saveToStorage])
  
  // Delete view
  const deleteView = useCallback((viewId) => {
    setViews(prev => {
      const updated = prev.filter(v => v.id !== viewId)
      const customViews = updated.filter(v => !v.isDefault)
      saveToStorage(customViews)
      return updated
    })
    
    if (currentView?.id === viewId) {
      setCurrentView(null)
    }
  }, [currentView, saveToStorage])
  
  // Apply view
  const applyView = useCallback((viewId) => {
    const view = views.find(v => v.id === viewId)
    if (view) {
      setCurrentView(view)
      return view.config
    }
    return null
  }, [views])
  
  // Clear current view
  const clearView = useCallback(() => {
    setCurrentView(null)
  }, [])
  
  return {
    views,
    currentView,
    createView,
    updateView,
    deleteView,
    applyView,
    clearView
  }
}
```

#### **File: components/ViewsManager.jsx**
```jsx
import React, { useState } from 'react'
import './ViewsManager.css'

const ViewsManager = ({ views, currentView, onApplyView, onCreateView, onDeleteView, onClose }) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [newViewIcon, setNewViewIcon] = useState('📌')
  
  const handleCreate = (currentConfig) => {
    if (!newViewName.trim()) return
    
    onCreateView(newViewName, currentConfig, newViewIcon)
    setNewViewName('')
    setNewViewIcon('📌')
    setShowCreateForm(false)
  }
  
  const icons = ['⭐', '📌', '🎯', '📊', '🔍', '⚡', '🚀', '💼', '📱', '⏳']
  
  return (
    <div className="views-manager">
      <div className="manager-header">
        <h3>💾 Saved Views</h3>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>
      
      <div className="views-list">
        {views.map(view => (
          <div
            key={view.id}
            className={`view-item ${currentView?.id === view.id ? 'active' : ''}`}
          >
            <button
              className="view-btn"
              onClick={() => onApplyView(view.id)}
            >
              <span className="view-icon">{view.icon}</span>
              <span className="view-name">{view.name}</span>
              {view.isDefault && <span className="view-badge">Default</span>}
            </button>
            
            {!view.isDefault && (
              <button
                className="delete-view"
                onClick={() => onDeleteView(view.id)}
                title="Delete view"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="create-view-section">
        {!showCreateForm ? (
          <button
            className="btn-create-view"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ Create New View
          </button>
        ) : (
          <div className="create-form">
            <input
              type="text"
              placeholder="View name..."
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              className="view-name-input"
              autoFocus
            />
            
            <div className="icon-picker">
              {icons.map(icon => (
                <button
                  key={icon}
                  className={`icon-btn ${newViewIcon === icon ? 'active' : ''}`}
                  onClick={() => setNewViewIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
            
            <div className="form-actions">
              <button
                className="btn-save"
                onClick={() => handleCreate({ /* current config */ })}
                disabled={!newViewName.trim()}
              >
                Save
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewViewName('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewsManager
```

---

## ✅ **Testing Checklist:**

### **Smart Search:**
- [ ] Simple search works across all columns
- [ ] Exact match finds only perfect matches
- [ ] Regex search with patterns (^, $, *, etc.)
- [ ] Multi-term search with AND/OR
- [ ] Search history saves and displays
- [ ] Match count accurate
- [ ] Clear search works

### **Saved Views:**
- [ ] Default views load correctly
- [ ] Can create custom view
- [ ] Apply view restores settings
- [ ] Delete custom view works
- [ ] Current view indicator shows
- [ ] Views persist across sessions

---

## 🎯 **Claude Code Instructions:**

```
PHASE 2 IMPLEMENTATION:

1. CREATE new files (in order):
   - utils/searchUtils.js
   - hooks/useSavedViews.js
   - components/SmartSearch.jsx + .css
   - components/ViewsManager.jsx + .css

2. MODIFY SpreadsheetView.jsx:
   - Import SmartSearch, ViewsManager, useSavedViews
   - Add SmartSearch to toolbar (replace basic quick filter)
   - Add ViewsManager toggle button
   - Wire up view application logic

3. UPDATE state management:
   - Track search results
   - Track current view
   - Apply view config to grid

COMPLEXITY: Medium
TIME: 60 minutes
```

---

**Next: PHASE_3_Export_and_Formatting.md**
