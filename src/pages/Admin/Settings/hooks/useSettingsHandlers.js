/**
 * useSettingsHandlers Hook
 * All handler functions for Settings page
 * Extracted from Settings/index.jsx
 */

import { useCallback } from 'react'

export const useSettingsHandlers = ({
  // General
  formData,
  setFormData,
  setSaving,
  setMessage,
  showMessage,
  updateSettings,
  t,

  // Server
  serverMode,
  setServerMode,
  setServerIP,
  setConnectedClients,
  setServerLoading,

  // Users
  users,
  setUsers,
  newUser,
  setNewUser,
  setUserLoading,
  fetchUsers,

  // Permissions
  permissions,
  setPermissions,
  setPermissionsSaving,

  // Notifications
  notificationSettings,
  setNotificationSettings,
  setNotificationSaving,

  // Firebase
  firebaseConfig,
  setFirebaseConfig,
  setFirebaseStatus,
  setFirebaseSyncing,
  setFirebaseSaving,
  firebaseSites,
  updateFirebaseSite,
  addFirebaseSite,

  // Import
  fileInputRef,
  importComparison,
  setImportStep,
  setImportFile,
  setImportComparison,
  setImportProgress,
  setImportError,
  parseExcelFile,
  compareData,
  canImport
}) => {

  // General Settings Handlers
  const handleSelectFile = useCallback(async () => {
    try {
      const result = await window.electron.selectExcelFile()
      if (result.success) {
        setFormData({ ...formData, excel_path: result.filePath })
      }
    } catch (error) {
      console.error('File selection error:', error)
    }
  }, [formData, setFormData])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setMessage(null)
    try {
      const result = await updateSettings(formData)
      if (result.success) {
        showMessage('success', t('settings.saved'))
      } else {
        showMessage('error', result.error)
      }
    } catch (error) {
      showMessage('error', error.message)
    } finally {
      setSaving(false)
    }
  }, [formData, setSaving, setMessage, updateSettings, showMessage, t])

  // Server Mode Handlers
  const handleToggleServer = useCallback(async () => {
    setServerLoading(true)
    try {
      if (serverMode) {
        await window.electron.stopServers()
        setServerMode(false)
        setServerIP('')
        setConnectedClients(0)
      } else {
        const result = await window.electron.startServers()
        if (result && (result.success || result.apiRunning)) {
          setServerMode(true)
          const info = await window.electron.getServerInfo()
          if (info && info.addresses && info.addresses.length > 0) {
            setServerIP(info.addresses[0].address)
          }
        } else {
          showMessage('error', 'Failed to start server')
        }
      }
    } catch (error) {
      showMessage('error', error.message)
    }
    setServerLoading(false)
  }, [serverMode, setServerMode, setServerIP, setConnectedClients, setServerLoading, showMessage])

  const copyIP = useCallback((serverIP) => {
    if (serverIP) {
      navigator.clipboard.writeText(`${serverIP}:3001`)
      showMessage('success', t('settings.ipCopied', 'IP copied to clipboard!'), 2000)
    }
  }, [showMessage, t])

  // User Management Handlers
  const handleCreateUser = useCallback(async () => {
    if (!newUser.password) {
      showMessage('error', 'Password is required')
      return
    }
    if (newUser.role === 'Contractor' && !newUser.contractor_name) {
      showMessage('error', 'Please select a contractor')
      return
    }
    if (newUser.role !== 'Contractor' && !newUser.username) {
      showMessage('error', 'Username is required')
      return
    }

    setUserLoading(true)
    try {
      const username = newUser.role === 'Contractor' ? newUser.contractor_name : newUser.username
      const result = await window.electron.createUser({
        username,
        password: newUser.password,
        role: newUser.role.toLowerCase().replace(' ', '_'),
        contractorName: newUser.role === 'Contractor' ? newUser.contractor_name : null
      })

      if (result.success) {
        showMessage('success', 'User created successfully')
        setNewUser({ role: 'Contractor', username: '', contractor_name: '', password: '' })
        const usersResult = await window.electron.getUsers()
        if (usersResult.success) {
          setUsers(usersResult.users || [])
        }
      } else {
        showMessage('error', result.error || 'Failed to create user')
      }
    } catch (error) {
      showMessage('error', error.message)
    }
    setUserLoading(false)
  }, [newUser, setNewUser, setUserLoading, setUsers, showMessage])

  const handleDeleteUser = useCallback(async (userId) => {
    if (userId === 1) {
      showMessage('error', 'Cannot delete admin user!')
      return
    }
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      try {
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, { method: 'DELETE' })
        if (response.ok) {
          await fetchUsers()
          showMessage('success', 'User deleted successfully')
          return
        }
      } catch (apiError) {
        console.log('API not available, trying Electron IPC...')
      }

      const result = await window.electron.deleteUser({ id: userId })
      if (result.success) {
        setUsers(users.filter(u => u.id !== userId))
        showMessage('success', 'User deleted successfully')
      } else {
        showMessage('error', result.error || 'Failed to delete user')
      }
    } catch (error) {
      showMessage('error', error.message)
    }
  }, [users, setUsers, fetchUsers, showMessage])

  // Permissions Handlers
  const handleTogglePermission = useCallback((role, page) => {
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [page]: !prev[role][page] }
    }))
  }, [setPermissions])

  const handleSavePermissions = useCallback(async () => {
    setPermissionsSaving(true)
    try {
      if (window.electron?.savePermissions) {
        const result = await window.electron.savePermissions(permissions)
        if (result.success) {
          showMessage('success', 'Permissions saved successfully')
        } else {
          showMessage('error', result.error || 'Failed to save permissions')
        }
      } else {
        localStorage.setItem('rolePermissions', JSON.stringify(permissions))
        showMessage('success', 'Permissions saved successfully')
      }
    } catch (error) {
      showMessage('error', error.message)
    }
    setPermissionsSaving(false)
  }, [permissions, setPermissionsSaving, showMessage])

  // Notification Handlers
  const handleToggleNotification = useCallback((key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }, [setNotificationSettings])

  const handleSaveNotificationSettings = useCallback(async () => {
    setNotificationSaving(true)
    try {
      if (window.electron?.updateNotificationSettings) {
        const result = await window.electron.updateNotificationSettings(notificationSettings)
        if (result.success) {
          showMessage('success', 'Notification settings saved successfully')
        } else {
          showMessage('error', result.error || 'Failed to save notification settings')
        }
      } else {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
        showMessage('success', 'Notification settings saved successfully')
      }
    } catch (error) {
      showMessage('error', error.message)
    }
    setNotificationSaving(false)
  }, [notificationSettings, setNotificationSaving, showMessage])

  const handleTestNotification = useCallback(async () => {
    try {
      if (window.electron?.testNotification) {
        await window.electron.testNotification()
        showMessage('success', 'Test notification sent!')
      } else {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Test Notification', { body: 'Notifications are working correctly!' })
          showMessage('success', 'Test notification sent!')
        } else if ('Notification' in window) {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            new Notification('Test Notification', { body: 'Notifications are working correctly!' })
            showMessage('success', 'Test notification sent!')
          } else {
            showMessage('error', 'Notification permission denied')
          }
        }
      }
    } catch (error) {
      showMessage('error', error.message)
    }
  }, [showMessage])

  // Firebase Handlers - DISABLED
  // Firebase has been replaced with Supabase/SQLite
  const handleFirebaseSync = useCallback(async () => {
    showMessage('info', 'Firebase is disabled. Using Supabase/SQLite instead.', 3000)
  }, [showMessage])

  const handleSaveFirebaseConfig = useCallback(async () => {
    showMessage('info', 'Firebase is disabled. Using Supabase/SQLite instead.', 3000)
  }, [showMessage])

  const handleSelectFirebaseExcelFile = useCallback(async () => {
    showMessage('info', 'Firebase is disabled. Using Supabase/SQLite instead.', 3000)
  }, [showMessage])

  // Import Handlers
  const handleCancelImport = useCallback(() => {
    setImportStep('idle')
    setImportFile(null)
    setImportComparison(null)
    setImportError(null)
    setImportProgress({ current: 0, total: 0, message: '' })
  }, [setImportStep, setImportFile, setImportComparison, setImportError, setImportProgress])

  const handleImportFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setImportStep('parsing')
    setImportError(null)

    try {
      const result = await parseExcelFile(file, {
        sheetName: firebaseConfig.excel?.sheetName || 'Master',
        headerRowIndex: firebaseConfig.excel?.headerRowIndex || 2
      })

      if (result.success) {
        const comparison = compareData(result.data, firebaseSites)
        setImportComparison(comparison)
        setImportStep('preview')
      } else {
        setImportError(result.error)
        setImportStep('idle')
      }
    } catch (error) {
      setImportError(error.message)
      setImportStep('idle')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [firebaseConfig, firebaseSites, parseExcelFile, compareData, setImportFile, setImportStep, setImportError, setImportComparison, fileInputRef])

  const handleConfirmImport = useCallback(async () => {
    if (!importComparison || !canImport) return

    setImportStep('importing')
    setImportError(null)

    const { newSites, updatedSites } = importComparison
    const total = newSites.length + updatedSites.length
    let current = 0

    try {
      for (const update of updatedSites) {
        current++
        setImportProgress({ current, total, message: `Updating ${update.siteId}...` })
        const result = await updateFirebaseSite(update.firebaseId, update.newData)
        if (!result.success) {
          console.error(`Failed to update ${update.siteId}:`, result.error)
        }
      }

      for (const site of newSites) {
        current++
        setImportProgress({ current, total, message: `Adding ${site.siteId}...` })
        if (addFirebaseSite) {
          const result = await addFirebaseSite(site)
          if (!result.success) {
            console.error(`Failed to add ${site.siteId}:`, result.error)
          }
        }
      }

      setImportProgress({
        current: total,
        total,
        message: `Import complete! Updated ${updatedSites.length}, Added ${newSites.length} sites.`
      })
      setImportStep('complete')
      showMessage('success', `Import complete! Updated ${updatedSites.length}, Added ${newSites.length} sites.`)

      setTimeout(() => handleCancelImport(), 5000)
    } catch (error) {
      setImportError(error.message)
      setImportStep('preview')
    }
  }, [importComparison, canImport, updateFirebaseSite, addFirebaseSite, setImportStep, setImportError, setImportProgress, showMessage, handleCancelImport])

  return {
    // General
    handleSelectFile,
    handleSave,

    // Server
    handleToggleServer,
    copyIP,

    // Users
    handleCreateUser,
    handleDeleteUser,

    // Permissions
    handleTogglePermission,
    handleSavePermissions,

    // Notifications
    handleToggleNotification,
    handleSaveNotificationSettings,
    handleTestNotification,

    // Firebase
    handleFirebaseSync,
    handleSaveFirebaseConfig,
    handleSelectFirebaseExcelFile,

    // Import
    handleImportFileSelect,
    handleCancelImport,
    handleConfirmImport
  }
}

export default useSettingsHandlers
