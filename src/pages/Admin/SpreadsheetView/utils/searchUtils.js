/**
 * Advanced search utilities for SpreadsheetView
 * Supports: Simple, Exact, Regex, and Multi-term search modes
 */

export const searchModes = {
  SIMPLE: 'simple',      // Basic text search (case-insensitive)
  REGEX: 'regex',        // Regular expression search
  EXACT: 'exact',        // Exact match only
  MULTI: 'multi'         // Multiple terms with AND/OR operators
}

/**
 * Perform search across data with the specified mode
 * @param {Array} data - Array of row objects to search
 * @param {string} query - Search query
 * @param {string} mode - Search mode from searchModes
 * @param {Array|null} columns - Specific columns to search (null = all columns)
 * @returns {Array} - Filtered data matching the query
 */
export const performSearch = (data, query, mode = searchModes.SIMPLE, columns = null) => {
  if (!data || !Array.isArray(data)) return []
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

/**
 * Simple case-insensitive text search
 */
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

/**
 * Exact match search (case-sensitive)
 */
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

/**
 * Regular expression search with error handling
 */
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
    console.error('Invalid regex pattern:', error.message)
    return data // Return original data on invalid regex
  }
}

/**
 * Multi-term search with AND/OR operators
 * Syntax: "term1 AND term2" or "term1 OR term2"
 */
const searchMulti = (data, query, columns) => {
  // Check for operators
  const hasAND = query.toUpperCase().includes(' AND ')
  const hasOR = query.toUpperCase().includes(' OR ')

  if (!hasAND && !hasOR) {
    // No operators found, fall back to simple search
    return searchSimple(data, query, columns)
  }

  const operator = hasAND ? 'AND' : 'OR'
  const terms = query
    .split(new RegExp(` ${operator} `, 'i'))
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)

  if (terms.length === 0) return data

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

/**
 * Escape special regex characters in a string
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Highlight matching text in a string
 * @param {string} text - Original text
 * @param {string} query - Search query to highlight
 * @param {string} mode - Search mode
 * @returns {string} - Text with <mark> tags around matches
 */
export const highlightMatches = (text, query, mode = searchModes.SIMPLE) => {
  if (!query || !text) return text

  try {
    let regex
    if (mode === searchModes.REGEX) {
      regex = new RegExp(`(${query})`, 'gi')
    } else {
      regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
    }
    return String(text).replace(regex, '<mark>$1</mark>')
  } catch {
    return text
  }
}

// Search History Management
const HISTORY_KEY = 'spreadsheet_search_history'
const MAX_HISTORY_ITEMS = 10

/**
 * Save a search query to history
 * @param {string} query - Query to save
 */
export const saveSearchHistory = (query) => {
  if (!query || query.trim().length < 2) return

  const sanitizedQuery = query.trim().substring(0, 100) // Limit length
  const history = getSearchHistory()

  // Remove duplicate and add to front
  const updated = [sanitizedQuery, ...history.filter(q => q !== sanitizedQuery)]
    .slice(0, MAX_HISTORY_ITEMS)

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

/**
 * Get search history from localStorage
 * @returns {Array<string>} - Array of previous search queries
 */
export const getSearchHistory = () => {
  try {
    const history = localStorage.getItem(HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

/**
 * Clear all search history
 */
export const clearSearchHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    console.error('Failed to clear search history:', error)
  }
}

/**
 * Validate if a regex pattern is valid
 * @param {string} pattern - Pattern to validate
 * @returns {boolean} - True if valid
 */
export const isValidRegex = (pattern) => {
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

export default {
  searchModes,
  performSearch,
  highlightMatches,
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  isValidRegex
}
