/**
 * Pagination Component
 * Modern, accessible pagination with YAS brand colors
 */

import React from 'react'
import './Pagination.css'

const Pagination = ({
  paginationInfo,
  itemsPerPage,
  itemsPerPageOptions,
  onPageChange,
  onItemsPerPageChange,
  onFirstPage,
  onLastPage,
  onNextPage,
  onPreviousPage,
  className = ''
}) => {
  const {
    start,
    end,
    total,
    currentPage,
    totalPages,
    hasNext,
    hasPrevious
  } = paginationInfo

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 7
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show subset with ellipsis
      if (currentPage <= 4) {
        // Near start
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // Near end
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        // Middle
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (total === 0) return null

  const pageNumbers = getPageNumbers()

  return (
    <div className={`pagination ${className}`}>
      {/* Items Per Page Selector */}
      <div className="pagination__per-page">
        <label htmlFor="items-per-page">Show:</label>
        <select
          id="items-per-page"
          value={itemsPerPage}
          onChange={(e) => {
            const value = e.target.value === 'all' ? 'all' : Number(e.target.value)
            onItemsPerPageChange(value)
          }}
          className="pagination__select"
        >
          {itemsPerPageOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value="all">All ({total})</option>
        </select>
      </div>

      {/* Info */}
      <div className="pagination__info">
        Showing <strong>{start}</strong> - <strong>{end}</strong> of <strong>{total}</strong>
      </div>

      {/* Navigation */}
      {itemsPerPage !== 'all' && totalPages > 1 && (
        <div className="pagination__controls">
          {/* First Page */}
          <button
            onClick={onFirstPage}
            disabled={!hasPrevious}
            className="pagination__btn pagination__btn--first"
            aria-label="First page"
            title="First page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2h2v12H3V2zm10.293.293L7.586 8l5.707 5.707 1.414-1.414L10.414 8l4.293-4.293-1.414-1.414z" />
            </svg>
          </button>

          {/* Previous Page */}
          <button
            onClick={onPreviousPage}
            disabled={!hasPrevious}
            className="pagination__btn pagination__btn--prev"
            aria-label="Previous page"
            title="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.354 2.646a.5.5 0 0 1 0 .708L6.707 8l4.647 4.646a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708 0z"/>
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="pagination__pages">
            {pageNumbers.map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="pagination__ellipsis">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`pagination__page ${page === currentPage ? 'pagination__page--active' : ''}`}
                  aria-label={`Page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          {/* Next Page */}
          <button
            onClick={onNextPage}
            disabled={!hasNext}
            className="pagination__btn pagination__btn--next"
            aria-label="Next page"
            title="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 2.646a.5.5 0 0 1 .708 0l5 5a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708-.708L9.293 8 4.646 3.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>

          {/* Last Page */}
          <button
            onClick={onLastPage}
            disabled={!hasNext}
            className="pagination__btn pagination__btn--last"
            aria-label="Last page"
            title="Last page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 2h2v12h-2V2zM2.707 2.293L8.414 8l-5.707 5.707 1.414 1.414L8.414 10.414 4.121 6.121l-1.414-1.414z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default Pagination
