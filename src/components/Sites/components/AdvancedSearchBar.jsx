/**
 * AdvancedSearchBar Component
 * Multi-field search with auto-complete and history
 */

import React, { useState, useRef, useEffect } from 'react'
import './AdvancedSearchBar.css'

const AdvancedSearchBar = ({
  searchQuery,
  onSearchChange,
  searchFields,
  onFieldsChange,
  searchMode,
  onModeChange,
  suggestions = [],
  searchHistory = [],
  onClearHistory,
  placeholder = 'Search sites...',
  className = ''
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showFieldsMenu, setShowFieldsMenu] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
        setShowHistory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const value = e.target.value
    onSearchChange(value)
    setShowSuggestions(value.length >= 2)
    setShowHistory(false)
  }

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true)
    } else if (searchHistory.length > 0) {
      setShowHistory(true)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    onSearchChange(suggestion)
    setShowSuggestions(false)
    setShowHistory(false)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    onSearchChange('')
    setShowSuggestions(false)
    setShowHistory(false)
    inputRef.current?.focus()
  }

  const toggleField = (field) => {
    if (field === 'all') {
      onFieldsChange(['all'])
    } else {
      const newFields = searchFields.includes('all') ? [field] :
        searchFields.includes(field) ?
          searchFields.filter(f => f !== field) :
          [...searchFields, field]
      
      onFieldsChange(newFields.length === 0 ? ['all'] : newFields)
    }
  }

  const fieldOptions = [
    { value: 'all', label: 'All Fields', icon: '🔍' },
    { value: 'site_id', label: 'Site ID', icon: '🆔' },
    { value: 'final_site_name', label: 'Site Name', icon: '📍' },
    { value: 'tssr_subcon', label: 'Contractor', icon: '👷' },
    { value: 'governorate', label: 'Governorate', icon: '🗺️' },
    { value: 'phase_name', label: 'Phase', icon: '📊' }
  ]

  return (
    <div className={`advanced-search-bar ${className}`} ref={suggestionsRef}>
      <div className="advanced-search-bar__container">
        {/* Search Icon */}
        <div className="advanced-search-bar__icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="advanced-search-bar__input"
          aria-label="Search"
        />

        {/* Fields Selector */}
        <div className="advanced-search-bar__fields">
          <button
            className="advanced-search-bar__fields-btn"
            onClick={() => setShowFieldsMenu(!showFieldsMenu)}
            aria-label="Select search fields"
          >
            {searchFields.includes('all') ? 'All' : `${searchFields.length} fields`}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 5.646a.5.5 0 01.708 0L8 8.293l2.646-2.647a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 010-.708z"/>
            </svg>
          </button>

          {showFieldsMenu && (
            <div className="advanced-search-bar__fields-menu">
              {fieldOptions.map(option => (
                <label key={option.value} className="advanced-search-bar__field-option">
                  <input
                    type="checkbox"
                    checked={searchFields.includes(option.value)}
                    onChange={() => toggleField(option.value)}
                  />
                  <span className="advanced-search-bar__field-icon">{option.icon}</span>
                  <span className="advanced-search-bar__field-label">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Mode Toggle */}
        <button
          className={`advanced-search-bar__mode ${searchMode === 'boolean' ? 'advanced-search-bar__mode--active' : ''}`}
          onClick={() => onModeChange(searchMode === 'simple' ? 'boolean' : 'simple')}
          title={searchMode === 'simple' ? 'Switch to Boolean mode (AND, OR, NOT)' : 'Switch to Simple mode'}
          aria-label="Toggle search mode"
        >
          {searchMode === 'simple' ? 'ABC' : 'A&B'}
        </button>

        {/* Clear Button */}
        {searchQuery && (
          <button
            className="advanced-search-bar__clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="advanced-search-bar__suggestions">
          <div className="advanced-search-bar__suggestions-header">Suggestions</div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="advanced-search-bar__suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* History */}
      {showHistory && searchHistory.length > 0 && (
        <div className="advanced-search-bar__suggestions">
          <div className="advanced-search-bar__suggestions-header">
            Recent Searches
            <button
              className="advanced-search-bar__clear-history"
              onClick={onClearHistory}
            >
              Clear
            </button>
          </div>
          {searchHistory.slice(0, 5).map((item, index) => (
            <button
              key={index}
              className="advanced-search-bar__suggestion"
              onClick={() => handleSuggestionClick(item.query)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
                <path fillRule="evenodd" d="M7.5 3a.5.5 0 01.5.5v5.21l3.248 1.856a.5.5 0 01-.496.868l-3.5-2A.5.5 0 017 9V3.5a.5.5 0 01.5-.5z"/>
              </svg>
              {item.query}
            </button>
          ))}
        </div>
      )}

      {/* Boolean Mode Helper */}
      {searchMode === 'boolean' && (
        <div className="advanced-search-bar__helper">
          <strong>Boolean Search:</strong> Use AND, OR, NOT operators
          <span className="advanced-search-bar__helper-example">
            Example: "Amman AND Approved" or "TASC NOT Rejected"
          </span>
        </div>
      )}
    </div>
  )
}

export default AdvancedSearchBar
