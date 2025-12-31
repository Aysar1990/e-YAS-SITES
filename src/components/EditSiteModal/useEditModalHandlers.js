/**
 * useEditModalHandlers Hook
 * Handlers for EditSiteModal
 */

import { useCallback } from 'react'
import { recalculateAll } from '../../utils/calculations'

export const useEditModalHandlers = ({
  site,
  user,
  canEdit,
  changes,
  formData,
  setFormData,
  fieldErrors,
  workflowWarnings,
  setSaving,
  setError,
  setSuccessMessage,
  newComment,
  setNewComment,
  setAddingComment,
  onSave,
  onClose
}) => {

  const handleSave = useCallback(async () => {
    if (!canEdit) {
      setError('You do not have permission to edit sites')
      return
    }

    if (Object.keys(changes).length === 0) {
      setError('No changes to save')
      return
    }

    if (Object.keys(fieldErrors).length > 0) {
      setError('Please fix validation errors before saving')
      return
    }

    if (Object.keys(workflowWarnings).length > 0) {
      const proceed = window.confirm(
        'There are workflow warnings:\n\n' +
        Object.values(workflowWarnings).join('\n') +
        '\n\nDo you want to proceed anyway?'
      )
      if (!proceed) return
    }

    setSaving(true)
    setError(null)

    try {
      const recalculated = recalculateAll(site, changes)

      const historyEntry = {
        user: user?.username || 'unknown',
        timestamp: new Date().toISOString(),
        changes: Object.entries(changes).map(([field, newValue]) => ({
          field,
          oldValue: site[field] || '',
          newValue
        }))
      }

      const updatesWithHistory = {
        ...changes,
        tssrOverallStatus: recalculated.tssrOverallStatus,
        actionAge: recalculated.actionAge,
        workflowProgress: recalculated.workflowProgress,
        editHistory: [...(site.editHistory || []), historyEntry],
        lastModifiedBy: user?.username,
        lastModifiedAt: new Date().toISOString()
      }

      const result = await onSave(site.id, updatesWithHistory)
      if (result.success) {
        setSuccessMessage('Changes saved successfully!')
        setTimeout(() => onClose(), 1500)
      } else {
        setError(result.error || 'Failed to save changes')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [canEdit, changes, fieldErrors, workflowWarnings, site, user, onSave, onClose, setSaving, setError, setSuccessMessage])

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return
    if (!canEdit) {
      setError('You do not have permission to add comments')
      return
    }

    setAddingComment(true)
    try {
      const newCommentObj = {
        user: user?.username || 'unknown',
        text: newComment.trim(),
        timestamp: new Date().toISOString()
      }

      const updatedComments = [...(site.comments || []), newCommentObj]

      const result = await onSave(site.id, { comments: updatedComments })
      if (result.success) {
        setFormData(prev => ({ ...prev, comments: updatedComments }))
        setNewComment('')
        setSuccessMessage('Comment added!')
        setTimeout(() => setSuccessMessage(null), 2000)
      } else {
        setError(result.error || 'Failed to add comment')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingComment(false)
    }
  }, [newComment, canEdit, user, site, onSave, setFormData, setNewComment, setAddingComment, setError, setSuccessMessage])

  return {
    handleSave,
    handleAddComment
  }
}

export default useEditModalHandlers
