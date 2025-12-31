/**
 * API Manager
 * Handles API source detection and instance management
 * NO MOCK DATA - Real data only
 */

import ApiClient from '../services/apiClient'

// Check if running in cloud mode
const isCloudMode = () => {
  return import.meta.env.VITE_API_URL || 
         window.location.hostname.includes('vercel.app') ||
         window.location.hostname.includes('netlify.app')
}

// Get cloud API URL
const getCloudApiUrl = () => {
  // First check environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Fallback: construct URL from current hostname for Render/Vercel
  const hostname = window.location.hostname
  if (hostname.includes('vercel.app')) {
    // If on Vercel, try to use the corresponding Render backend
    // Format: appname.vercel.app -> appname-api.onrender.com
    const appName = hostname.split('.')[0].replace('-app', '').replace('app', '')
    return `https://${appName}-api.onrender.com/api`
  }

  // Last resort fallback
  console.warn('[API Manager] No VITE_API_URL set, using default')
  return 'https://tssr-monitor-api.onrender.com/api'
}

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
  // PRIORITY 1: If running in Electron, always use Electron API
  const isElectron = !!(window.electron)
  if (isElectron) {
    console.log('[API Manager] ✅ Using Electron mode (standalone)')
    localStorage.removeItem('tssr_mode')
    localStorage.removeItem('tssr_server_ip')
    return window.electron
  }

  // PRIORITY 2: Cloud mode - connect to cloud API
  if (isCloudMode()) {
    const cloudUrl = getCloudApiUrl()
    console.log('[API Manager] ✅ Using Cloud mode:', cloudUrl)
    return new ApiClient(cloudUrl)
  }

  // PRIORITY 3: Client mode - connect to remote server
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
  return localStorage.getItem('tssr_mode') === 'client' || isCloudMode()
}

export const getServerIP = () => {
  if (isCloudMode()) {
    return getCloudApiUrl()
  }
  return localStorage.getItem('tssr_server_ip')
}

export default getApiInstance
