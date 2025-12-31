/**
 * useSavedViews - Hook for managing saved view presets
 * Handles localStorage persistence and view CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'

const VIEWS_STORAGE_KEY = 'spreadsheet_saved_views'

// Default views that ship with the application
const defaultViews = [
  {
    id: 'essential',
    name: 'Essential View',
    icon: '*',
    config: {
      visibleColumns: [
        'site_id',
        'final_site_name',
        'governorate',
        'tssr_overall_status',
        'ti_status',
        'rf_plan_status',
        'rf_optim_status',
        'civil_status'
      ],
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
    icon: 'N',
    config: {
      visibleColumns: [
        'site_id',
        'final_site_name',
        'nokia_npo_status',
        'nokia_npo_comment',
        'nokia_site_owner',
        'tssr_overall_status'
      ],
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
    icon: '~',
    config: {
      visibleColumns: [
        'site_id',
        'final_site_name',
        'tssr_overall_status',
        'tssr_status_date',
        'ti_status',
        'rf_plan_status',
        'rf_optim_status',
        'civil_status',
        'action_age'
      ],
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

  // Load views from localStorage on mount
  useEffect(() => {
    const loadViews = () => {
      try {
        const stored = localStorage.getItem(VIEWS_STORAGE_KEY)
        const customViews = stored ? JSON.parse(stored) : []

        // Validate custom views
        const validCustomViews = customViews.filter(
          v => v && v.id && v.name && v.config
        )

        setViews([...defaultViews, ...validCustomViews])
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
      // Sanitize before saving
      const sanitized = customViews.map(v => ({
        id: v.id,
        name: String(v.name).substring(0, 50),
        icon: v.icon || '?',
        config: v.config,
        isDefault: false,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt
      }))
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(sanitized))
    } catch (error) {
      console.error('Failed to save views:', error)
    }
  }, [])

  /**
   * Create a new custom view
   * @param {string} name - View name
   * @param {Object} config - View configuration
   * @param {string} icon - Icon character
   * @returns {Object} - The created view
   */
  const createView = useCallback((name, config, icon = '?') => {
    const sanitizedName = String(name).trim().substring(0, 50)
    if (!sanitizedName) return null

    const newView = {
      id: `custom_${Date.now()}`,
      name: sanitizedName,
      icon: icon || '?',
      config: {
        visibleColumns: config.visibleColumns || [],
        density: config.density || 'comfortable',
        filters: config.filters || null,
        sort: config.sort || null,
        pinnedColumns: config.pinnedColumns || []
      },
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

  /**
   * Update an existing view
   * @param {string} viewId - ID of view to update
   * @param {Object} updates - Properties to update
   */
  const updateView = useCallback((viewId, updates) => {
    setViews(prev => {
      const updated = prev.map(v => {
        if (v.id !== viewId) return v
        if (v.isDefault) return v // Don't update default views

        return {
          ...v,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      })

      const customViews = updated.filter(v => !v.isDefault)
      saveToStorage(customViews)
      return updated
    })
  }, [saveToStorage])

  /**
   * Delete a custom view
   * @param {string} viewId - ID of view to delete
   * @returns {boolean} - True if deleted
   */
  const deleteView = useCallback((viewId) => {
    // Find the view first
    const viewToDelete = views.find(v => v.id === viewId)
    if (!viewToDelete || viewToDelete.isDefault) {
      return false // Can't delete default views
    }

    setViews(prev => {
      const updated = prev.filter(v => v.id !== viewId)
      const customViews = updated.filter(v => !v.isDefault)
      saveToStorage(customViews)
      return updated
    })

    // Clear current view if it was deleted
    if (currentView?.id === viewId) {
      setCurrentView(null)
    }

    return true
  }, [currentView, saveToStorage, views])

  /**
   * Apply a view and return its configuration
   * @param {string} viewId - ID of view to apply
   * @returns {Object|null} - View configuration or null
   */
  const applyView = useCallback((viewId) => {
    const view = views.find(v => v.id === viewId)
    if (view) {
      setCurrentView(view)
      return view.config
    }
    return null
  }, [views])

  /**
   * Clear the current view selection
   */
  const clearView = useCallback(() => {
    setCurrentView(null)
  }, [])

  /**
   * Get a view by ID
   * @param {string} viewId - View ID
   * @returns {Object|null} - View or null
   */
  const getViewById = useCallback((viewId) => {
    return views.find(v => v.id === viewId) || null
  }, [views])

  /**
   * Check if a view name already exists
   * @param {string} name - Name to check
   * @returns {boolean} - True if exists
   */
  const viewNameExists = useCallback((name) => {
    const normalizedName = String(name).trim().toLowerCase()
    return views.some(v => v.name.toLowerCase() === normalizedName)
  }, [views])

  return {
    views,
    currentView,
    createView,
    updateView,
    deleteView,
    applyView,
    clearView,
    getViewById,
    viewNameExists,
    defaultViews
  }
}

export default useSavedViews
