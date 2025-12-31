/**
 * API Manager
 * Handles API source detection and instance management
 * NO MOCK DATA - Real data only
 */

import ApiClient from '../services/apiClient'

// Empty API - returns empty data instead of mock
const emptyAPI = {
  getData: async () => ({ success: true, sites: [], count: 0 }),
  getStats: async () => ({ success: true, stats: { statusBreakdown: [], departmentStats: {}, contractorsSummary: [] } }),
  getPhases: async () => ({ success: true, phases: [] }),
  searchSites: async () => ({ success: true, sites: [] }),
  getSettings: async () => ({ success: true, settings: {} }),
  updateSettings: async () => ({ success: true }),
  getRejections: async () => ({ success: true, rejections: [], unviewedCount: 0 }),
  markRejectionsViewed: async () => ({ success: true }),
  getContractors: async () => ({ success: true, contractors: [] }),
  manualSync: async () => ({ success: false, message: 'Not connected to server' }),
  exportExcel: async () => ({ success: false, message: 'Not connected to server' }),
  getActivityLog: async () => ({ success: true, logs: [] }),
  getStatsByPartOf: async () => ({ success: true, stats: [] }),
  getOverviewTable: async () => ({ success: true, table: [] }),
  getPartOfValues: async () => ({ success: true, values: [] }),
  getContractorDetailedStats: async () => ({ success: true, contractors: [] }),
  getLiveSyncStatus: async () => ({ success: true, enabled: false }),
  toggleLiveSync: async () => ({ success: true }),
  onSyncComplete: () => {},
  onLiveSyncUpdate: () => {},
  onLiveSyncComplete: () => {},
  removeAllListeners: () => {},
}

// Determine API source based on mode
const getApi = () => {
  // PRIORITY: If running in Electron, always use Electron API
  const isElectron = !!(window.electron)
  if (isElectron) {
    console.log('[API Manager] ✅ Using Electron mode (standalone)')
    localStorage.removeItem('tssr_mode')
    localStorage.removeItem('tssr_server_ip')
    return window.electron
  }

  // Client mode - connect to remote server
  const mode = localStorage.getItem('tssr_mode')
  const serverIP = localStorage.getItem('tssr_server_ip')

  if (mode === 'client' && serverIP) {
    console.log('[API Manager] ✅ Using API Client mode:', serverIP)
    return new ApiClient(serverIP)
  }

  // No connection - return empty API (NO MOCK DATA)
  console.log('[API Manager] ⚠️ No connection - showing empty state')
  return emptyAPI
}

// Singleton
let apiInstance = null

export const getApiInstance = () => {
  if (!apiInstance) {
    apiInstance = getApi()
  }
  return apiInstance
}

export const resetApiInstance = () => {
  apiInstance = null
}

export const isClientMode = () => {
  return localStorage.getItem('tssr_mode') === 'client'
}

export const getServerIP = () => {
  return localStorage.getItem('tssr_server_ip')
}

export default getApiInstance
