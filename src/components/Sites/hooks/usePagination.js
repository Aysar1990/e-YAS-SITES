/**
 * usePagination Hook
 * Provides pagination functionality for Sites page
 * 
 * Features:
 * - Customizable items per page (10, 20, 50, 100, All)
 * - Page navigation (First, Previous, Next, Last)
 * - Jump to specific page
 * - Persistent state in localStorage
 * - Performance optimized
 */

import { useState, useMemo, useEffect } from 'react'

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_ITEMS_PER_PAGE = 20

export const usePagination = (items = [], storageKey = 'sites_pagination') => {
  // Load initial state from localStorage
  const loadInitialState = () => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { itemsPerPage, currentPage } = JSON.parse(saved)
        return { itemsPerPage, currentPage }
      }
    } catch (error) {
      console.warn('Failed to load pagination state:', error)
    }
    return { itemsPerPage: DEFAULT_ITEMS_PER_PAGE, currentPage: 1 }
  }

  const initial = loadInitialState()
  const [itemsPerPage, setItemsPerPage] = useState(initial.itemsPerPage)
  const [currentPage, setCurrentPage] = useState(initial.currentPage)

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ itemsPerPage, currentPage }))
    } catch (error) {
      console.warn('Failed to save pagination state:', error)
    }
  }, [itemsPerPage, currentPage, storageKey])

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (itemsPerPage === 'all') return 1
    return Math.ceil(items.length / itemsPerPage)
  }, [items.length, itemsPerPage])

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Get paginated items
  const paginatedItems = useMemo(() => {
    if (itemsPerPage === 'all') return items
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  // Pagination info
  const paginationInfo = useMemo(() => {
    if (itemsPerPage === 'all') {
      return {
        start: 1,
        end: items.length,
        total: items.length,
        currentPage: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      }
    }

    const start = items.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
    const end = Math.min(currentPage * itemsPerPage, items.length)

    return {
      start,
      end,
      total: items.length,
      currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1
    }
  }, [items.length, currentPage, itemsPerPage, totalPages])

  // Navigation functions
  const goToPage = (page) => {
    const pageNum = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(pageNum)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToNextPage = () => {
    if (paginationInfo.hasNext) setCurrentPage(prev => prev + 1)
  }
  const goToPreviousPage = () => {
    if (paginationInfo.hasPrevious) setCurrentPage(prev => prev - 1)
  }

  const changeItemsPerPage = (value) => {
    setItemsPerPage(value)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  return {
    // Paginated data
    paginatedItems,
    
    // State
    itemsPerPage,
    currentPage,
    totalPages,
    
    // Info
    paginationInfo,
    
    // Actions
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    changeItemsPerPage,
    
    // Options
    itemsPerPageOptions: ITEMS_PER_PAGE_OPTIONS
  }
}

export default usePagination
