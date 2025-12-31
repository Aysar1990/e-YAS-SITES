import { useState, useEffect, useRef } from 'react'

const SingleFileImport = () => {
  const [file, setFile] = useState(null)
  const [filePath, setFilePath] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // 🆕 useRef for file input
  const fileInputRef = useRef(null)

  // Setup progress listener
  useEffect(() => {
    if (!window.electron) return

    const handleProgress = (data) => {
      const progressMap = {
        validating: 10,
        parsing: 30,
        processing: 50,
        saving: 75,
        complete: 100
      }
      setProgress(progressMap[data.stage] || data.percentage || 0)
    }

    window.electron.onImportProgress(handleProgress)

    return () => {
      window.electron.removeImportProgressListener()
    }
  }, [])

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xlsm')) {
      setError('Please select a valid Excel file (.xlsx or .xlsm)')
      return
    }

    setFile(selectedFile)
    setFilePath(selectedFile.path) // Electron provides file.path
    setError(null)
    setResult(null)

    // Use real IPC validation if in Electron
    if (!window.electron) {
      // Fallback to mock in browser
      const mockInfo = {
        name: selectedFile.name,
        size: selectedFile.size,
        sheets: Math.floor(Math.random() * 5) + 1,
        rows: Math.floor(Math.random() * 3000) + 500,
        columns: Math.floor(Math.random() * 30) + 40,
      }
      setFileInfo(mockInfo)
      return
    }

    try {
      const validation = await window.electron.validateSingle(selectedFile.path)

      if (validation.success && validation.valid) {
        setFileInfo({
          name: validation.fileInfo.name,
          size: validation.fileInfo.size,
          sheets: validation.fileInfo.sheets || 1,
          rows: validation.fileInfo.totalRecords || 0,
          columns: 68, // Standard TSSR columns
        })
      } else {
        setError(validation.errors[0]?.message || 'File validation failed')
        setFile(null)
        setFilePath(null)
      }
    } catch (err) {
      setError('Failed to validate file: ' + err.message)
      setFile(null)
      setFilePath(null)
    }
  }

  const handleImport = async () => {
    if (!file || !filePath) return

    setImporting(true)
    setProgress(0)
    setError(null)

    // Use real IPC if in Electron
    if (!window.electron) {
      // Fallback to mock import in browser
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      const mockResult = {
        success: true,
        imported: fileInfo.rows,
        updated: Math.floor(fileInfo.rows * 0.8),
        created: Math.floor(fileInfo.rows * 0.2),
        duration: '2.5s',
      }

      setResult(mockResult)
      setImporting(false)
      return
    }

    try {
      const importResult = await window.electron.importSingle(filePath)

      if (importResult.success) {
        setResult({
          success: true,
          imported: importResult.result.totalRecords,
          updated: importResult.result.updated,
          created: importResult.result.inserted,
          failed: importResult.result.failed,
          duration: '—',
        })
      } else {
        throw new Error(importResult.error || 'Import failed')
      }
    } catch (err) {
      console.error('Import error:', err)
      setError('Import failed: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setFilePath(null)
    setFileInfo(null)
    setResult(null)
    setError(null)
    setProgress(0)
  }

  // ✅ FIXED: Use ref instead of getElementById
  const handleReplaceFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="single-file-import">
      {/* Hidden File Input - Always Present */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xlsm"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Success Result */}
      {result && (
        <div className="import-success">
          <div className="success-icon">✅</div>
          <h3>Import Successful!</h3>
          <div className="success-details">
            <div className="detail-item">
              <span className="detail-label">Total Records</span>
              <span className="detail-value">{result.imported.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Updated</span>
              <span className="detail-value">{result.updated.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created</span>
              <span className="detail-value">{result.created.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{result.duration}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={handleReset}>
            Import Another File
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="import-error">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button className="btn-secondary" onClick={handleReset}>
            Try Again
          </button>
        </div>
      )}

      {/* Main Import Interface */}
      {!result && !error && (
        <>
          {/* File Upload Button */}
          {!file && (
            <div className="upload-container">
              <div className="upload-icon">📄</div>
              <h3>Select Excel File</h3>
              <p className="upload-description">
                Choose a single Excel file to import site data
              </p>
              <button
                className="btn-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </button>
              <p className="file-formats">Supports: .xlsx, .xlsm</p>
            </div>
          )}

          {/* File Preview */}
          {file && fileInfo && (
            <div className="file-preview">
              <div className="preview-header">
                <div className="file-icon-large">📊</div>
                <div className="file-details">
                  <h3>{fileInfo.name}</h3>
                  <p className="file-size">{formatFileSize(fileInfo.size)}</p>
                </div>
                <button className="btn-replace" onClick={handleReplaceFile}>
                  Replace File
                </button>
              </div>

              <div className="preview-stats">
                <div className="stat-card">
                  <div className="stat-icon">📑</div>
                  <div className="stat-info">
                    <span className="stat-value">{fileInfo.sheets}</span>
                    <span className="stat-label">Sheets</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <span className="stat-value">{fileInfo.rows.toLocaleString()}</span>
                    <span className="stat-label">Rows</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <span className="stat-value">{fileInfo.columns}</span>
                    <span className="stat-label">Columns</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {importing && (
                <div className="import-progress">
                  <div className="progress-header">
                    <span>Importing data...</span>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div
                      className="progress-bar"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Import Actions */}
              <div className="import-actions">
                <button
                  className="btn-import-single"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? '⏳ Importing...' : 'Import File'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={handleReset}
                  disabled={importing}
                >
                  Cancel
                </button>
              </div>

              {/* Information Box */}
              <div className="info-box">
                <div className="info-icon">ℹ️</div>
                <div className="info-content">
                  <h4>Import Information</h4>
                  <ul>
                    <li>Existing records will be updated based on Site ID</li>
                    <li>New sites will be added automatically</li>
                    <li>Invalid rows will be skipped with warnings</li>
                    <li>All changes are logged in the activity log</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SingleFileImport
