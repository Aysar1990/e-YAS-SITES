/**
 * useEditModalState Hook
 * State management for EditSiteModal
 */

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  calculateOverallStatus,
  validateField,
  validateStatusChange,
  getWorkflowSummary,
  DEPARTMENTS
} from '../../utils/calculations'

export const useEditModalState = (site) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('status')
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [changes, setChanges] = useState({})
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [workflowWarnings, setWorkflowWarnings] = useState({})

  const canEdit = user?.role === 'admin' || user?.role === 'Admin'

  const workflowInfo = useMemo(() => getWorkflowSummary(formData), [formData])

  useEffect(() => {
    if (site) {
      setFormData({ ...site })
      setChanges({})
      setError(null)
      setSuccessMessage(null)
      setNewComment('')
      setActiveTab('status')
      setFieldErrors({})
      setWorkflowWarnings({})
    }
  }, [site])

  const handleChange = (key, value) => {
    const newFormData = { ...formData, [key]: value }
    setFormData(newFormData)

    // Track changes
    if (site[key] !== value) {
      setChanges(prev => ({ ...prev, [key]: value }))
    } else {
      setChanges(prev => {
        const newChanges = { ...prev }
        delete newChanges[key]
        return newChanges
      })
    }

    // Validate field
    const validation = validateField(key, value)
    if (!validation.valid) {
      setFieldErrors(prev => ({ ...prev, [key]: validation.error }))
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }

    // Check workflow validation for department status changes
    const dept = DEPARTMENTS.find(d => d.statusField === key)
    if (dept) {
      const workflowCheck = validateStatusChange(formData, dept.key, value)
      if (!workflowCheck.allowed) {
        setWorkflowWarnings(prev => ({ ...prev, [key]: workflowCheck.reason }))
      } else {
        setWorkflowWarnings(prev => {
          const newWarnings = { ...prev }
          delete newWarnings[key]
          return newWarnings
        })
      }

      // Auto-calculate overall status
      const newOverallStatus = calculateOverallStatus(newFormData)
      if (newOverallStatus !== formData.tssrOverallStatus) {
        setFormData(prev => ({ ...prev, tssrOverallStatus: newOverallStatus }))
        setChanges(prev => ({ ...prev, tssrOverallStatus: newOverallStatus }))
      }
    }
  }

  return {
    user,
    canEdit,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    saving,
    setSaving,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    changes,
    setChanges,
    newComment,
    setNewComment,
    addingComment,
    setAddingComment,
    fieldErrors,
    workflowWarnings,
    workflowInfo,
    handleChange,
    hasChanges: Object.keys(changes).length > 0,
    comments: formData.comments || [],
    editHistory: formData.editHistory || []
  }
}

export default useEditModalState
