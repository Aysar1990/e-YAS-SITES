/**
 * useBatchImport Hook
 * State and handlers for batch import
 * Extracted from BatchImport.jsx
 */

import { useState, useCallback, useEffect } from 'react'
import { filterExcelFiles } from './batchImportUtils'

// Create file object with proper path (for use with Electron dialog)
const createFileObjectFromPath = (fileInfo) => ({
  id: Math.random().toString(36).substr(2, 9),
  path: fileInfo.path,
  name: fileInfo.name,
  size: fileInfo.size,
  status: 'ready',
  error: null,
})

// Create file object from browser File (fallback - path may be undefined)
const createFileObjectFromFile = (file) => ({
  id: Math.random().toString(36).substr(2, 9),
  file,
  path: file.path, // Will be undefined in browser, available in Electron with certain settings
  name: file.name,
  size: file.size,
  status: 'ready',
  error: null,
})

export const useBatchImport = () => {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ overall: 0, current: '' })
  const [importResults, setImportResults] = useState(null)

  // Setup progress listener
  useEffect(() => {
    if (!window.electron) return

    const handleProgress = (data) => {
      setProgress({
        overall: data.percentage || 0,
        current: data.currentFile || `Processing file ${data.current || 0} of ${data.total || 0}`
      })
    }

    window.electron.onImportProgress(handleProgress)

    return () => {
      window.electron.removeImportProgressListener()
    }
  }, [])

  // Drag handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Validate files
  const validateFiles = useCallback(async (filesToValidate) => {
    if (!window.electron) {
      // Mock validation
      filesToValidate.forEach((fileObj) => {
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id ? { ...f, status: 'valid' } : f
            )
          )
        }, 500)
      })
      return
    }

    // Update to validating status
    setFiles((prev) =>
      prev.map((f) => {
        const isValidating = filesToValidate.some(fv => fv.id === f.id)
        return isValidating ? { ...f, status: 'validating' } : f
      })
    )

    try {
      const filePaths = filesToValidate.map(f => f.path)
      const result = await window.electron.validateBatch(filePaths)

      if (result.success) {
        setFiles((prev) =>
          prev.map((f) => {
            const validation = result.results.find(r => r.fileName === f.name)
            if (!validation) return f
            return {
              ...f,
              status: validation.valid ? 'valid' : 'invalid',
              error: validation.errors.length > 0 ? validation.errors[0].message : null
            }
          })
        )
      }
    } catch (error) {
      console.error('Validation error:', error)
      setFiles((prev) =>
        prev.map((f) => {
          const isBeingValidated = filesToValidate.some(fv => fv.id === f.id)
          return isBeingValidated ? { ...f, status: 'invalid', error: error.message } : f
        })
      )
    }
  }, [])

  // Handle file drop (fallback - may not work in all Electron configs)
  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const { files: excelFiles, error } = filterExcelFiles(droppedFiles)

    if (error) {
      alert(error)
      return
    }

    const filesWithStatus = excelFiles.map(createFileObjectFromFile)

    // Check if paths are available (Electron with proper config)
    const hasValidPaths = filesWithStatus.every(f => f.path)
    if (!hasValidPaths && window.electron) {
      alert('Drag & drop is not supported. Please use the "Browse Files" button.')
      return
    }

    setFiles((prev) => [...prev, ...filesWithStatus])
    await validateFiles(filesWithStatus)
  }, [validateFiles])

  // Handle file input from HTML input (fallback for browser)
  const handleFileInput = useCallback(async (e) => {
    const selectedFiles = Array.from(e.target.files)
    const { files: excelFiles, error } = filterExcelFiles(selectedFiles)

    if (error) {
      alert(error)
      return
    }

    const filesWithStatus = excelFiles.map(createFileObjectFromFile)

    // Check if paths are available
    const hasValidPaths = filesWithStatus.every(f => f.path)
    if (!hasValidPaths && window.electron) {
      // Paths not available, fall back to native dialog
      alert('Please use the "Browse Files" button to select files.')
      e.target.value = '' // Reset input
      return
    }

    setFiles((prev) => [...prev, ...filesWithStatus])
    await validateFiles(filesWithStatus)
  }, [validateFiles])

  // Handle file selection using Electron native dialog (recommended)
  const handleBrowseFiles = useCallback(async () => {
    if (!window.electron?.selectImportFiles) {
      // Fallback to HTML input if not in Electron
      document.getElementById('batch-file-input')?.click()
      return
    }

    try {
      const result = await window.electron.selectImportFiles()

      if (!result.success) {
        if (result.error !== 'No files selected') {
          alert(result.error)
        }
        return
      }

      const filesWithStatus = result.files.map(createFileObjectFromPath)
      // Replace files (single file mode)
      setFiles(filesWithStatus)
      await validateFiles(filesWithStatus)
    } catch (error) {
      console.error('Error selecting files:', error)
      alert('Error selecting files: ' + error.message)
    }
  }, [validateFiles])

  // Remove file
  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // Mock import (browser mode)
  const mockImport = useCallback(async () => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      setProgress({
        overall: Math.round(((i + 1) / files.length) * 100),
        current: `Importing ${file.name}...`,
      })

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: 'importing' } : f
        )
      )

      await new Promise((resolve) => setTimeout(resolve, 1000))
      const success = Math.random() > 0.1

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: success ? 'success' : 'error', error: success ? null : 'Failed to parse Excel file' }
            : f
        )
      )
    }

    const successCount = files.filter((f) => f.status === 'success').length
    return { total: files.length, success: successCount, failed: files.length - successCount }
  }, [files])

  // Import all files
  const handleImportAll = useCallback(async () => {
    if (files.length === 0) return

    setImporting(true)
    setProgress({ overall: 0, current: '' })

    if (!window.electron) {
      const results = await mockImport()
      setImportResults(results)
      setImporting(false)
      setProgress({ overall: 100, current: 'Import complete!' })
      return
    }

    try {
      const filePaths = files.map(f => f.path)
      const result = await window.electron.importBatch(filePaths)

      if (result.success) {
        setFiles((prev) =>
          prev.map((f) => {
            const fileResult = result.results.find(r => r.fileName === f.name)
            if (!fileResult) return f
            return {
              ...f,
              status: fileResult.status === 'COMPLETED' || fileResult.status === 'PARTIAL' ? 'success' : 'error',
              error: fileResult.failed > 0 ? `${fileResult.failed} records failed` : null
            }
          })
        )

        setImportResults({
          total: result.fileCount,
          success: result.results.filter(r => r.status === 'COMPLETED' || r.status === 'PARTIAL').length,
          failed: result.results.filter(r => r.status === 'FAILED').length,
          totalRecords: result.totalImported
        })
      } else {
        throw new Error(result.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert(`Import failed: ${error.message}`)
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', error: error.message }))
      )
    } finally {
      setImporting(false)
    }
  }, [files, mockImport])

  // Reset
  const handleReset = useCallback(() => {
    setFiles([])
    setImportResults(null)
    setProgress({ overall: 0, current: '' })
  }, [])

  return {
    files,
    isDragging,
    importing,
    progress,
    importResults,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleBrowseFiles,
    removeFile,
    handleImportAll,
    handleReset
  }
}

export default useBatchImport
