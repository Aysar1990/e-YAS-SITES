// useApi Hook - Custom hook for API calls with loading and error states

import { useState, useCallback } from 'react'
import api, { ApiError } from '../services/api'

const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  // Execute API call
  const execute = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      setData(result)
      return { success: true, data: result }
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // GET request
  const get = useCallback((endpoint, params) => {
    return execute(() => api.get(endpoint, params))
  }, [execute])

  // POST request
  const post = useCallback((endpoint, data) => {
    return execute(() => api.post(endpoint, data))
  }, [execute])

  // PUT request
  const put = useCallback((endpoint, data) => {
    return execute(() => api.put(endpoint, data))
  }, [execute])

  // PATCH request
  const patch = useCallback((endpoint, data) => {
    return execute(() => api.patch(endpoint, data))
  }, [execute])

  // DELETE request
  const remove = useCallback((endpoint) => {
    return execute(() => api.delete(endpoint))
  }, [execute])

  // Reset state
  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    loading,
    error,
    data,
    get,
    post,
    put,
    patch,
    delete: remove,
    reset,
    execute,
  }
}

export default useApi
