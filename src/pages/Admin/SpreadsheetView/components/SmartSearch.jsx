/**
 * SmartSearch - Advanced search component with multiple modes
 * Supports: Simple, Exact, Regex, and Multi-term (AND/OR) search
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  searchModes,
  performSearch,
  saveSearchHistory,
  getSearchHistory,
  isValidRegex
} from '../utils/searchUtils'
import './SmartSearch.css'

const SmartSearch = ({ data, onSearchResults, columns }) => {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState(searchModes.SIMPLE)
  const [showHistory, setShowHistory] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [matchCount, setMatchCount] = useState(null)
  const [regexError, setRegexError] = useState(null)
  const inputRef = useRef(null)
  const historyTimeoutRef = useRef(null)

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // Perform search when query, mode, or data changes
  useEffect(() => {
    // Clear regex error when changing modes
    if (mode !== searchModes.REGEX) {
      setRegexError(null)
    }

    if (!query || query.trim() === '') {
      onSearchResults(data, null)
      setMatchCount(null)
      setRegexError(null)
      return
    }

    // Validate regex if in regex mode
    if (mode === searchModes.REGEX && !isValidRegex(query)) {
      setRegexError('Invalid regex pattern')
      onSearchResults(data, null)
      setMatchCount(null)
      return
    }

    setRegexError(null)
    const results = performSearch(data, query, mode, columns)

    onSearchResults(results, query)
    setMatchCount(results.length)

    // Save to history on successful search with results
    if (results.length > 0 && query.length > 2) {
      saveSearchHistory(query)
      setSearchHistory(getSearchHistory())
    }
  }, [query, mode, data, columns, onSearchResults])

  // Handle clicking on a history item
  const handleHistoryClick = useCallback((historyQuery) => {
    setQuery(historyQuery)
    setShowHistory(false)
    inputRef.current?.focus()
  }, [])

  // Clear the search
  const clearSearch = useCallback(() => {
    setQuery('')
    setMatchCount(null)
    setRegexError(null)
    inputRef.current?.focus()
  }, [])

  // Handle focus - show history
  const handleFocus = useCallback(() => {
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current)
    }
    setShowHistory(true)
  }, [])

  // Handle blur - hide history with delay
  const handleBlur = useCallback(() => {
    historyTimeoutRef.current = setTimeout(() => {
      setShowHistory(false)
    }, 200)
  }, [])

  // Get mode-specific placeholder text
  const getPlaceholder = () => {
    switch (mode) {
      case searchModes.EXACT:
        return 'Enter exact value to match...'
      case searchModes.REGEX:
        return 'Enter regex pattern (e.g., ^421.*)'
      case searchModes.MULTI:
        return 'Use AND/OR (e.g., "Baghdad AND Approved")'
      default:
        return 'Smart search across all columns...'
    }
  }

  return (
    <div className="smart-search">
      <div className={`search-input-wrapper ${regexError ? 'error' : ''}`}>
        <span className="search-icon">?</span>

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={getPlaceholder()}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {query && (
          <button className="clear-search" onClick={clearSearch} title="Clear search">
            x
          </button>
        )}

        {matchCount !== null && !regexError && (
          <span className={`match-count ${matchCount === 0 ? 'no-match' : ''}`}>
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        )}

        {regexError && (
          <span className="regex-error" title={regexError}>
            ! Invalid
          </span>
        )}
      </div>

      <div className="search-modes">
        <button
          className={`mode-btn ${mode === searchModes.SIMPLE ? 'active' : ''}`}
          onClick={() => setMode(searchModes.SIMPLE)}
          title="Simple text search (case-insensitive)"
        >
          Simple
        </button>
        <button
          className={`mode-btn ${mode === searchModes.EXACT ? 'active' : ''}`}
          onClick={() => setMode(searchModes.EXACT)}
          title="Exact match (case-sensitive)"
        >
          Exact
        </button>
        <button
          className={`mode-btn ${mode === searchModes.REGEX ? 'active' : ''}`}
          onClick={() => setMode(searchModes.REGEX)}
          title="Regular expression search"
        >
          Regex
        </button>
        <button
          className={`mode-btn ${mode === searchModes.MULTI ? 'active' : ''}`}
          onClick={() => setMode(searchModes.MULTI)}
          title="Multiple terms with AND/OR operators"
        >
          Multi
        </button>
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && !query && (
        <div className="search-history">
          <div className="history-header">Recent Searches</div>
          {searchHistory.map((item, idx) => (
            <div
              key={idx}
              className="history-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleHistoryClick(item)}
            >
              <span className="history-icon">~</span>
              <span className="history-text">{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mode-specific help text */}
      {mode === searchModes.MULTI && query && (
        <div className="search-help">
          <small>Tip: Use "term1 AND term2" or "term1 OR term2"</small>
        </div>
      )}

      {mode === searchModes.REGEX && query && !regexError && (
        <div className="search-help">
          <small>Tip: ^start, end$, .* any, [0-9] digits</small>
        </div>
      )}
    </div>
  )
}

export default SmartSearch
