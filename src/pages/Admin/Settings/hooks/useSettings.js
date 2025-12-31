/**
 * Settings state management hook
 * Centralized state and handlers for all settings sections
 * Firebase DISABLED: All Firebase state removed
 * @module pages/Admin/Settings/hooks/useSettings
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../../../../context/DataContext'
import { useAuth } from '../../../../context/AuthContext'
// import { useFirebaseData } from '../../../../hooks/useFirebaseData' // DISABLED
import { parseExcelFile, compareData } from '../../../../services/importService'

export const useSettings = () => {
  const { t } = useTranslation()
  const { settings, updateSettings, phases } = useData()
  const { user } = useAuth()

  // General Settings State
  const [formData, setFormData] = useState({
    excel_path: '',
    sync_interval: '5',
    active_phase: 'RO4',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Server Mode State
  const [serverMode, setServerMode] = useState(false)
  const [serverIP, setServerIP] = useState('')
  const [connectedClients, setConnectedClients] = useState(0)
  const [serverLoading, setServerLoading] = useState(false)

  // User Management State
  const [users, setUsers] = useState([])
  const [contractorsList, setContractorsList] = useState([])
  const [newUser, setNewUser] = useState({
    role: 'Contractor',
    username: '',
    contractor_name: '',
    password: ''
  })
  const [userLoading, setUserLoading] = useState(false)

  // Role Permissions State
  const [permissions, setPermissions] = useState({
    Management: { dashboard: true, contractors: true, sites: true, reports: true, settings: false, ghirbal: false, clearTssr: false },
    'Nokia Engineer': { dashboard: true, contractors: true, sites: true, reports: true, settings: false, ghirbal: true, clearTssr: true },
    Contractor: { dashboard: true, contractors: false, sites: true, reports: false, settings: false, ghirbal: false, clearTssr: false }
  })
  const [permissionsSaving, setPermissionsSaving] = useState(false)

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    statusChanges: true,
    rejections: true,
    approvals: true,
    newComments: true,
    syncComplete: false,
    userLogins: false
  })
  const [notificationSaving, setNotificationSaving] = useState(false)

  // Firebase Sync State - DISABLED (keeping for backward compatibility)
  const [firebaseConfig, setFirebaseConfig] = useState(null)
  const [firebaseStatus, setFirebaseStatus] = useState({ connected: false, lastSync: null, sitesCount: 0 })
  const [firebaseSyncing, setFirebaseSyncing] = useState(false)
  const [firebaseSaving, setFirebaseSaving] = useState(false)

  // Import Excel State
  const fileInputRef = useRef(null)
  const [importStep, setImportStep] = useState('idle')
  const [importFile, setImportFile] = useState(null)
  const [importData, setImportData] = useState(null)
  const [importComparison, setImportComparison] = useState(null)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' })
  const [importError, setImportError] = useState(null)

  // Firebase data hook - DISABLED
  // const { sites: firebaseSites, ... } = useFirebaseData(...)
  const firebaseSites = []
  const firebaseConnected = false
  const firebaseDataLoading = false
  const updateFirebaseSite = () => console.warn('Firebase disabled')
  const addFirebaseSite = () => console.warn('Firebase disabled')

  // Check if user can import (Admin only)
  const canImport = user?.role === 'admin' || user?.role === 'Admin'

  // Helper to show temporary message
  const showMessage = (type, text, duration = 3000) => {
    setMessage({ type, text })
    if (duration > 0) {
      setTimeout(() => setMessage(null), duration)
    }
  }

  // Initialize form data from settings
  useEffect(() => {
    if (settings) {
      setFormData({
        excel_path: settings.excel_path || '',
        sync_interval: settings.sync_interval || '5',
        active_phase: settings.active_phase || 'RO4',
      })
    }
  }, [settings])

  // Fetch Users with Passwords
  const fetchUsers = async () => {
    if (window.electron?.getUsers) {
      try {
        const result = await window.electron.getUsers()
        if (result.success) {
          setUsers(result.users || [])
          return
        }
      } catch (error) {
        console.error('Error fetching users via IPC:', error)
      }
    }

    try {
      const token = localStorage.getItem('tssr_auth_token')
      const response = await fetch('http://localhost:3001/api/users-with-passwords', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.log('API server not available')
    }
  }

  return {
    // Translation
    t,

    // Context data
    phases,
    user,
    canImport,

    // Message state
    message,
    setMessage,
    showMessage,

    // General Settings
    formData,
    setFormData,
    saving,
    setSaving,
    updateSettings,

    // Server Mode
    serverMode,
    setServerMode,
    serverIP,
    setServerIP,
    connectedClients,
    setConnectedClients,
    serverLoading,
    setServerLoading,

    // User Management
    users,
    setUsers,
    contractorsList,
    setContractorsList,
    newUser,
    setNewUser,
    userLoading,
    setUserLoading,
    fetchUsers,

    // Role Permissions
    permissions,
    setPermissions,
    permissionsSaving,
    setPermissionsSaving,

    // Notifications
    notificationSettings,
    setNotificationSettings,
    notificationSaving,
    setNotificationSaving,

    // Firebase
    firebaseConfig,
    setFirebaseConfig,
    firebaseStatus,
    setFirebaseStatus,
    firebaseSyncing,
    setFirebaseSyncing,
    firebaseSaving,
    setFirebaseSaving,
    firebaseSites,
    firebaseDataLoading,
    firebaseConnected,
    updateFirebaseSite,
    addFirebaseSite,

    // Import
    fileInputRef,
    importStep,
    setImportStep,
    importFile,
    setImportFile,
    importData,
    setImportData,
    importComparison,
    setImportComparison,
    importProgress,
    setImportProgress,
    importError,
    setImportError,
    parseExcelFile,
    compareData
  }
}

export default useSettings
