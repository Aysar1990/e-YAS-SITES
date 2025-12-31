/**
 * useGhirbalData Hook
 * State and handlers for Ghirbal page
 * Extracted from Ghirbal.jsx
 */

import { useState, useCallback, useEffect } from 'react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { GHIRBAL_STATUSES } from './ghirbalConfig'

export const useGhirbalData = () => {
  const { phases, activePhase } = useData()
  const { user } = useAuth()

  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhase, setSelectedPhase] = useState(activePhase || 'ALL')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)

  // Check if user is admin (read-only view)
  const isReadOnly = user?.role === 'admin'

  // Fetch sites
  const fetchSites = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (window.electron?.getGhirbalSites) {
        const result = await window.electron.getGhirbalSites(selectedPhase)
        if (result.success) {
          setSites(result.sites || [])
        } else {
          setError(result.error)
        }
      } else if (window.electron?.getData) {
        const result = await window.electron.getData({ phase: selectedPhase })
        if (result.success) {
          const ghirbalSites = result.sites.filter(site =>
            GHIRBAL_STATUSES.includes(site.tssr_overall_status)
          )
          setSites(ghirbalSites)
        } else {
          setError(result.error)
        }
      } else {
        setSites([])
      }
    } catch (err) {
      console.error('Error fetching Ghirbal sites:', err)
      setError(err.message)
    }

    setLoading(false)
  }, [selectedPhase])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  // Handle checkbox change
  const handleCheckChange = async (siteId, checked) => {
    // Optimistic update
    setSites(prev => prev.map(site =>
      site.site_id === siteId ? { ...site, nokia_checked: checked } : site
    ))

    try {
      if (window.electron?.updateNokiaReviewCheck) {
        const site = sites.find(s => s.site_id === siteId)
        await window.electron.updateNokiaReviewCheck({
          site_id: siteId,
          checked,
          note: site?.nokia_note || '',
          updated_by: user?.id || user?.username
        })
      }
    } catch (err) {
      console.error('Error updating check:', err)
      // Revert on error
      setSites(prev => prev.map(site =>
        site.site_id === siteId ? { ...site, nokia_checked: !checked } : site
      ))
    }
  }

  // Handle note change
  const handleNoteChange = (siteId, note) => {
    setSites(prev => prev.map(site =>
      site.site_id === siteId ? { ...site, nokia_note: note } : site
    ))
  }

  // Handle save
  const handleSave = async (siteId, checked, note) => {
    try {
      if (window.electron?.updateNokiaReviewCheck) {
        await window.electron.updateNokiaReviewCheck({
          site_id: siteId,
          checked: checked || false,
          note: note || '',
          updated_by: user?.id || user?.username
        })

        setSites(prev => prev.map(site =>
          site.site_id === siteId ? { ...site, nokia_note: note } : site
        ))
      }
    } catch (err) {
      console.error('Error saving:', err)
    }
  }

  // Stats
  const checkedCount = sites.filter(s => s.nokia_checked).length
  const totalCount = sites.length

  return {
    sites,
    loading,
    error,
    phases,
    selectedPhase,
    setSelectedPhase,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    isReadOnly,
    checkedCount,
    totalCount,
    fetchSites,
    handleCheckChange,
    handleNoteChange,
    handleSave
  }
}

export default useGhirbalData
