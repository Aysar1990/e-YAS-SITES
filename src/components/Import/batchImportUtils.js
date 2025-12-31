/**
 * BatchImport Utilities
 * Helper functions for batch import
 * Extracted from BatchImport.jsx
 */

// Format file size to human readable
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Get status icon
export const getStatusIcon = (status) => {
  const icons = {
    ready: '⏱️',
    validating: '🔄',
    valid: '✅',
    invalid: '❌',
    importing: '⏳',
    success: '✅',
    error: '❌'
  }
  return icons[status] || '📄'
}

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    valid: 'var(--yas-primary)',
    success: 'var(--yas-primary)',
    invalid: 'var(--yas-error)',
    error: 'var(--yas-error)',
    importing: 'var(--yas-secondary)',
    validating: 'var(--yas-secondary)'
  }
  return colors[status] || 'var(--text-secondary)'
}

// Create file object with status
export const createFileObject = (file) => ({
  file,
  path: file.path,
  id: Math.random().toString(36).substr(2, 9),
  name: file.name,
  size: file.size,
  status: 'ready',
  error: null,
})

// Filter Excel files from file list
export const filterExcelFiles = (files, maxFiles = 50) => {
  const excelFiles = files.filter(
    (file) => file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm')
  )

  if (excelFiles.length === 0) {
    return { files: [], error: 'Please drop valid Excel files (.xlsx or .xlsm)' }
  }

  if (excelFiles.length > maxFiles) {
    return { files: [], error: `Maximum ${maxFiles} files allowed. Please select fewer files.` }
  }

  return { files: excelFiles, error: null }
}

export default {
  formatFileSize,
  getStatusIcon,
  getStatusColor,
  createFileObject,
  filterExcelFiles
}
