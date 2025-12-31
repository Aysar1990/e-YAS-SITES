// API Service - Central API handler for YAS TSSR Monitor

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000

// Token storage key - must match AuthContext.jsx
const TOKEN_STORAGE_KEY = 'tssr_auth_token'

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

// Base fetch wrapper with auth and error handling
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getAuthToken()

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(
        error.message || `HTTP Error: ${response.status}`,
        response.status,
        error
      )
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408)
    }

    throw error
  }
}

// Custom API Error class
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// API Methods
const api = {
  // GET request
  get: async (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return fetchWithAuth(url, { method: 'GET' })
  },

  // POST request
  post: async (endpoint, data) => {
    return fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // PUT request
  put: async (endpoint, data) => {
    return fetchWithAuth(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // PATCH request
  patch: async (endpoint, data) => {
    return fetchWithAuth(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // DELETE request
  delete: async (endpoint) => {
    return fetchWithAuth(endpoint, { method: 'DELETE' })
  },

  // Upload file
  upload: async (endpoint, file, fieldName = 'file') => {
    const token = getAuthToken()
    const formData = new FormData()
    formData.append(fieldName, file)

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(error.message || 'Upload failed', response.status)
    }

    return response.json()
  },
}

export { api as default, ApiError }
