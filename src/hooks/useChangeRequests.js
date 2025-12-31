/**
 * useChangeRequests Hook
 * Manages change request state and operations
 */

import { useState, useEffect, useCallback } from 'react'

const electron = window.electron

export const useChangeRequests = (options = {}) => {
  const { autoRefresh = true, role = 'contractor', username = '' } = options

  const [requests, setRequests] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch pending requests (for Admin)
  const fetchPendingRequests = useCallback(async () => {
    if (!electron?.getPendingRequests) return

    setLoading(true)
    setError(null)

    try {
      const result = await electron.getPendingRequests({ limit: 100 })
      if (result.success) {
        setRequests(result.requests || [])
        setPendingCount(result.total || result.requests?.length || 0)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch user's own requests (for Contractor)
  const fetchMyRequests = useCallback(async (status = 'all') => {
    if (!electron?.getMyRequests || !username) return

    setLoading(true)
    setError(null)

    try {
      const result = await electron.getMyRequests({ username, status, limit: 50 })
      if (result.success) {
        setRequests(result.requests || [])
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [username])

  // Create a change request
  const createRequest = useCallback(async (data) => {
    if (!electron?.createChangeRequest) {
      return { success: false, error: 'API not available' }
    }

    try {
      const result = await electron.createChangeRequest(data)
      if (result.success && role === 'contractor') {
        // Refresh my requests after creating
        fetchMyRequests()
      }
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [role, fetchMyRequests])

  // Approve a request (Admin only)
  const approveRequest = useCallback(async (requestId, reviewedBy, comment = '') => {
    if (!electron?.approveChangeRequest) {
      return { success: false, error: 'API not available' }
    }

    try {
      const result = await electron.approveChangeRequest({
        requestId,
        reviewedBy,
        comment
      })
      if (result.success) {
        // Refresh pending requests
        fetchPendingRequests()
      }
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchPendingRequests])

  // Reject a request (Admin only)
  const rejectRequest = useCallback(async (requestId, reviewedBy, comment = '') => {
    if (!electron?.rejectChangeRequest) {
      return { success: false, error: 'API not available' }
    }

    try {
      const result = await electron.rejectChangeRequest({
        requestId,
        reviewedBy,
        comment
      })
      if (result.success) {
        // Refresh pending requests
        fetchPendingRequests()
      }
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchPendingRequests])

  // Get request history with filters
  const fetchHistory = useCallback(async (filters = {}) => {
    if (!electron?.getRequestHistory) return

    setLoading(true)
    setError(null)

    try {
      const result = await electron.getRequestHistory(filters)
      if (result.success) {
        setRequests(result.requests || [])
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get pending count
  const refreshPendingCount = useCallback(async () => {
    if (!electron?.getRequestCounts) return

    try {
      const result = await electron.getRequestCounts()
      if (result.success) {
        setPendingCount(result.counts?.pending || 0)
      }
    } catch (err) {
      console.error('Error fetching request counts:', err)
    }
  }, [])

  // Setup real-time listeners
  useEffect(() => {
    if (!autoRefresh || !electron) return

    // Subscribe to real-time updates
    electron.subscribeChangeRequests?.()

    // Handle new request created
    const handleCreated = (data) => {
      console.log('New change request:', data)
      if (role === 'admin') {
        fetchPendingRequests()
      }
      refreshPendingCount()
    }

    // Handle request reviewed
    const handleReviewed = (data) => {
      console.log('Request reviewed:', data)
      if (role === 'contractor' && username) {
        fetchMyRequests()
      } else if (role === 'admin') {
        fetchPendingRequests()
      }
      refreshPendingCount()
    }

    // Handle real-time update
    const handleUpdate = (data) => {
      console.log('Real-time update:', data)
      refreshPendingCount()
    }

    // Register listeners
    electron.onChangeRequestCreated?.(handleCreated)
    electron.onChangeRequestReviewed?.(handleReviewed)
    electron.onChangeRequestUpdate?.(handleUpdate)

    // Initial fetch
    if (role === 'admin') {
      fetchPendingRequests()
    } else if (role === 'contractor' && username) {
      fetchMyRequests()
    }
    refreshPendingCount()

    // Cleanup
    return () => {
      electron.removeChangeRequestListeners?.()
    }
  }, [autoRefresh, role, username, fetchPendingRequests, fetchMyRequests, refreshPendingCount])

  return {
    requests,
    pendingCount,
    loading,
    error,
    createRequest,
    approveRequest,
    rejectRequest,
    fetchPendingRequests,
    fetchMyRequests,
    fetchHistory,
    refreshPendingCount
  }
}

export default useChangeRequests
