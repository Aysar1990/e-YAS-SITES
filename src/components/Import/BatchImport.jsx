/**
 * BatchImport Component V2.0
 * REFACTORED: Extracted hooks and utilities
 * Original: 464 lines → Refactored: ~180 lines
 */

import { useBatchImport } from './useBatchImport'
import { formatFileSize, getStatusIcon, getStatusColor } from './batchImportUtils'

const BatchImport = () => {
  const {
    files, isDragging, importing, progress, importResults,
    handleDragOver, handleDragLeave, handleDrop, handleFileInput,
    handleBrowseFiles, removeFile, handleImportAll, handleReset
  } = useBatchImport()

  return (
    <div className="batch-import">
      {/* Import Results Summary */}
      {importResults && (
        <div className="import-results">
          <div className="results-icon">🎉</div>
          <h3>Import Complete!</h3>
          <div className="results-stats">
            <div className="stat-item">
              <span className="stat-label">Total Files</span>
              <span className="stat-value">{importResults.total}</span>
            </div>
            <div className="stat-item success">
              <span className="stat-label">Successful</span>
              <span className="stat-value">{importResults.success}</span>
            </div>
            <div className="stat-item failed">
              <span className="stat-label">Failed</span>
              <span className="stat-value">{importResults.failed}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={handleReset}>
            Import More Files
          </button>
        </div>
      )}

      {/* Drop Zone */}
      {!importResults && (
        <>
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-zone-icon">📊</div>
            <h3>Select Excel File</h3>
            <p className="drop-zone-subtitle">Choose an Excel file (.xlsx, .xlsm)</p>
            <div className="drop-zone-actions">
              <input
                type="file"
                id="batch-file-input"
                accept=".xlsx,.xlsm"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              <button
                className="btn-browse"
                onClick={handleBrowseFiles}
              >
                Browse Files
              </button>
            </div>
            {files.length > 0 && (
              <p className="file-count">File selected: {files[0]?.name}</p>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="file-list-container">
              <div className="file-list-header">
                <h4>Selected Files ({files.length})</h4>
                <button className="btn-clear" onClick={handleReset}>Clear All</button>
              </div>

              <div className="file-list">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="file-item"
                    style={{ borderColor: getStatusColor(fileObj.status) }}
                  >
                    <div className="file-icon">{getStatusIcon(fileObj.status)}</div>
                    <div className="file-info">
                      <div className="file-name">{fileObj.name}</div>
                      <div className="file-meta">
                        <span className="file-size">{formatFileSize(fileObj.size)}</span>
                        <span className="file-status" style={{ color: getStatusColor(fileObj.status) }}>
                          {fileObj.status}
                        </span>
                      </div>
                      {fileObj.error && <div className="file-error">{fileObj.error}</div>}
                    </div>
                    {!importing && (
                      <button
                        className="btn-remove"
                        onClick={() => removeFile(fileObj.id)}
                        title="Remove file"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Actions */}
          {files.length > 0 && (
            <div className="import-actions">
              {importing && (
                <div className="progress-container">
                  <div className="progress-info">
                    <span>{progress.current}</span>
                    <span className="progress-percent">{progress.overall}%</span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar" style={{ width: `${progress.overall}%` }}></div>
                  </div>
                </div>
              )}

              <div className="action-buttons">
                <button
                  className="btn-import"
                  onClick={handleImportAll}
                  disabled={importing || files.length === 0 || files.some((f) => f.status === 'invalid')}
                >
                  {importing ? '⏳ Importing...' : 'Import File'}
                </button>
                <button className="btn-cancel" onClick={handleReset} disabled={importing}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BatchImport
