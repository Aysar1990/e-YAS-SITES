/**
 * useSettingsEffects Hook
 * Side effects for Settings page
 * Extracted from Settings/index.jsx
 */

import { useEffect } from 'react'

export const useSettingsEffects = ({
  setServerMode,
  setServerIP,
  setConnectedClients,
  setContractorsList,
  setPermissions,
  setNotificationSettings,
  setFirebaseConfig,
  setFirebaseStatus,
  fetchUsers
}) => {

  // Check Server Status
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        if (window.electron?.getServerInfo) {
          const info = await window.electron.getServerInfo()
          if (info && info.addresses && info.addresses.length > 0) {
            setServerMode(true)
            setServerIP(info.addresses[0].address)
          }
        }
        if (window.electron?.getConnectedClients) {
          const clients = await window.electron.getConnectedClients()
          setConnectedClients(clients?.count || 0)
        }
      } catch (error) {
        setServerMode(false)
      }
    }
    checkServerStatus()
    const interval = setInterval(checkServerStatus, 5000)
    return () => clearInterval(interval)
  }, [setServerMode, setServerIP, setConnectedClients])

  // Fetch Users and Contractors
  useEffect(() => {
    const fetchUsersAndContractors = async () => {
      await fetchUsers()
      try {
        if (window.electron?.getContractors) {
          const result = await window.electron.getContractors()
          if (result.success) {
            const contractors = result.uniqueFromSites || []
            setContractorsList(Array.isArray(contractors) ? contractors : [])
          }
        }
        if (window.electron?.getPermissions) {
          const result = await window.electron.getPermissions()
          if (result.success && result.permissions) {
            setPermissions(result.permissions)
          }
        }
        if (window.electron?.getNotificationSettings) {
          const notifSettings = await window.electron.getNotificationSettings()
          if (notifSettings) {
            setNotificationSettings(notifSettings)
          }
        }
        // ⚠️ Firebase config removed - using Supabase/SQLite only
        // Firebase has been disabled and replaced with database-only approach
      } catch (error) {
        console.error('Error fetching users/contractors:', error)
      }
    }
    fetchUsersAndContractors()
  }, [fetchUsers, setContractorsList, setPermissions, setNotificationSettings])
}

export default useSettingsEffects
