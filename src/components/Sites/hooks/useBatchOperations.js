/**
 * useBatchOperations Hook
 * Manages batch operations on multiple sites
 */

import { useState, useCallback } from 'react'

export const useBatchOperations = (updateSiteFn) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState({ success: [], failed: [] })
  const [operationHistory, setOperationHistory] = useState([])

  // Reset state
  const reset = useCallback(() => {
    setIsProcessing(false)
    setProgress({ current: 0, total: 0 })
    setResults({ success: [], failed: [] })
  }, [])

  // Update multiple sites
  const batchUpdate = useCallback(async (siteIds, updates, operation = 'update') => {
    setIsProcessing(true)
    setProgress({ current: 0, total: siteIds.length })
    setResults({ success: [], failed: [] })

    const successList = []
    const failedList = []
    const timestamp = new Date().toISOString()

    for (let i = 0; i < siteIds.length; i++) {
      const siteId = siteIds[i]
      
      try {
        const result = await updateSiteFn(siteId, updates)
        
        if (result.success) {
          successList.push({ siteId, ...updates })
        } else {
          failedList.push({ siteId, error: result.error })
        }
      } catch (error) {
        failedList.push({ siteId, error: error.message })
      }

      // Update progress
      setProgress({ current: i + 1, total: siteIds.length })
    }

    const operationRecord = {
      id: `batch_${Date.now()}`,
      operation,
      timestamp,
      siteIds,
      updates,
      success: successList,
      failed: failedList,
      total: siteIds.length,
      successCount: successList.length,
      failedCount: failedList.length
    }

    setOperationHistory(prev => [operationRecord, ...prev].slice(0, 10))
    setResults({ success: successList, failed: failedList })
    setIsProcessing(false)

    return operationRecord
  }, [updateSiteFn])

  // Batch delete (soft delete - just update status)
  const batchDelete = useCallback(async (siteIds) => {
    return await batchUpdate(siteIds, { 
      tssr_overall_status: 'Deleted',
      deleted_at: new Date().toISOString()
    }, 'delete')
  }, [batchUpdate])

  // Batch status update
  const batchStatusUpdate = useCallback(async (siteIds, status) => {
    return await batchUpdate(siteIds, { tssr_overall_status: status }, 'status_update')
  }, [batchUpdate])

  // Batch contractor assignment
  const batchAssignContractor = useCallback(async (siteIds, contractor) => {
    return await batchUpdate(siteIds, { tssr_subcon: contractor }, 'contractor_assignment')
  }, [batchUpdate])

  // Batch priority update
  const batchPriorityUpdate = useCallback(async (siteIds, priority) => {
    return await batchUpdate(siteIds, { priority }, 'priority_update')
  }, [batchUpdate])

  // Undo last operation (if possible)
  const undoLastOperation = useCallback(async () => {
    if (operationHistory.length === 0) {
      return { success: false, error: 'No operations to undo' }
    }

    const lastOperation = operationHistory[0]
    
    // Only undo successful operations
    if (lastOperation.success.length === 0) {
      return { success: false, error: 'No successful operations to undo' }
    }

    // For now, we can't truly undo - would need previous values
    // This is a placeholder for future implementation
    return { success: false, error: 'Undo not implemented - requires history storage' }
  }, [operationHistory])

  return {
    // State
    isProcessing,
    progress,
    results,
    operationHistory,

    // Methods
    batchUpdate,
    batchDelete,
    batchStatusUpdate,
    batchAssignContractor,
    batchPriorityUpdate,
    undoLastOperation,
    reset
  }
}

export default useBatchOperations
