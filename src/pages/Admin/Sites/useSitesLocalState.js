/**
 * useSitesLocalState Hook
 * Local state management for Sites page
 * Extracted from Sites.jsx
 */

import { useState } from 'react'

/**
 * Hook for managing Sites page local state
 */
export const useSitesLocalState = () => {
  // Card flip state
  const [flippedCards, setFlippedCards] = useState({})

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState(null)

  // Export state
  const [exporting, setExporting] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table' | 'map'

  // Batch operation modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignType, setAssignType] = useState('contractor') // 'contractor' | 'status' | 'priority'
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  // Selection state
  const [selectedSites, setSelectedSites] = useState(new Set())

  // Lazy Loading State (with localStorage persistence)
  const [lazyLoadingEnabled, setLazyLoadingEnabled] = useState(() => {
    const stored = localStorage.getItem('tssr_lazy_loading_enabled')
    return stored !== null ? JSON.parse(stored) : true // Default: enabled
  })

  // Persist lazy loading preference
  const handleLazyLoadingToggle = (enabled) => {
    setLazyLoadingEnabled(enabled)
    localStorage.setItem('tssr_lazy_loading_enabled', JSON.stringify(enabled))
  }

  // Card flip handler
  const handleFlip = (siteId) => {
    setFlippedCards(prev => ({ ...prev, [siteId]: !prev[siteId] }))
  }

  // Selection handlers
  const handleSelectSite = (siteId) => {
    setSelectedSites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(siteId)) {
        newSet.delete(siteId)
      } else {
        newSet.add(siteId)
      }
      return newSet
    })
  }

  const handleClearSelection = () => {
    setSelectedSites(new Set())
  }

  // Open edit modal
  const openEditModal = (site) => {
    setSelectedSite(site)
    setEditModalOpen(true)
  }

  // Close edit modal
  const closeEditModal = () => {
    setEditModalOpen(false)
    setSelectedSite(null)
  }

  return {
    // Card state
    flippedCards,
    handleFlip,

    // Edit modal
    editModalOpen,
    selectedSite,
    openEditModal,
    closeEditModal,
    setSelectedSite,
    setEditModalOpen,

    // Export
    exporting,
    setExporting,

    // View mode
    viewMode,
    setViewMode,

    // Batch modals
    deleteModalOpen,
    setDeleteModalOpen,
    assignModalOpen,
    setAssignModalOpen,
    assignType,
    setAssignType,
    bulkModalOpen,
    setBulkModalOpen,

    // Selection
    selectedSites,
    setSelectedSites,
    handleSelectSite,
    handleClearSelection,

    // Lazy loading
    lazyLoadingEnabled,
    handleLazyLoadingToggle
  }
}

export default useSitesLocalState
