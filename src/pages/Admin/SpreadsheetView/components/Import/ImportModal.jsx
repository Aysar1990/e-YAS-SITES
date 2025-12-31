/**
 * Import Modal Component
 * Upload Excel files, map columns, preview and import data
 * PHASE 6: Data Management
 */

import React, { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import ColumnMapper from './ColumnMapper'
import './Import.css'

const IMPORT_STEPS = {
  UPLOAD: 'upload',
  MAP: 'map',
  PREVIEW: 'preview',
  IMPORT: 'import',
  COMPLETE: 'complete'
}

const ImportModal = ({
  columns = [],
  onImport,
  onClose
}) => {
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(IMPORT_STEPS.UPLOAD)
  const [file, setFile] = useState(null)
  const [rawData, setRawData] = useState([])
  const [headers, setHeaders] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [previewData, setPreviewData] = useState([])
  const [importStats, setImportStats] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Handle file selection
  const handleFileSelect = useCallback(async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ]

    const isValid = validTypes.some(type =>
      selectedFile.type === type || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')
    )

    if (!isValid) {
      setError('الرجاء اختيار ملف Excel (.xlsx أو .xls)')
      return
    }

    setFile(selectedFile)
    setError(null)
    setIsProcessing(true)

    try {
      const data = await readExcelFile(selectedFile)
      if (data.length === 0) {
        throw new Error('الملف فارغ')
      }

      // Extract headers from first row
      const excelHeaders = Object.keys(data[0])
      setHeaders(excelHeaders)
      setRawData(data)

      // Auto-map columns where names match
      const autoMapping = {}
      excelHeaders.forEach(header => {
        const matchedCol = columns.find(col =>
          col.field.toLowerCase() === header.toLowerCase() ||
          col.headerName.toLowerCase() === header.toLowerCase()
        )
        if (matchedCol) {
          autoMapping[header] = matchedCol.field
        }
      })
      setColumnMapping(autoMapping)

      setStep(IMPORT_STEPS.MAP)
    } catch (err) {
      console.error('[Import] Read error:', err)
      setError(err.message || 'فشل في قراءة الملف')
    } finally {
      setIsProcessing(false)
    }
  }, [columns])

  // Read Excel file
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })

          // Get first sheet
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
          resolve(jsonData)
        } catch (err) {
          reject(err)
        }
      }

      reader.onerror = () => reject(new Error('فشل في قراءة الملف'))
      reader.readAsArrayBuffer(file)
    })
  }

  // Handle mapping change
  const handleMappingChange = useCallback((excelCol, dbField) => {
    setColumnMapping(prev => ({
      ...prev,
      [excelCol]: dbField
    }))
  }, [])

  // Clear mapping
  const handleClearMapping = useCallback((excelCol) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev }
      delete newMapping[excelCol]
      return newMapping
    })
  }, [])

  // Proceed to preview
  const handlePreview = useCallback(() => {
    // Transform data using mapping
    const transformed = rawData.map(row => {
      const newRow = {}
      for (const [excelCol, dbField] of Object.entries(columnMapping)) {
        if (dbField) {
          newRow[dbField] = row[excelCol]
        }
      }
      return newRow
    })

    setPreviewData(transformed)
    setStep(IMPORT_STEPS.PREVIEW)
  }, [rawData, columnMapping])

  // Execute import
  const handleImport = useCallback(async () => {
    setIsProcessing(true)
    setStep(IMPORT_STEPS.IMPORT)

    try {
      const result = await onImport(previewData)

      setImportStats({
        total: previewData.length,
        imported: result?.imported || previewData.length,
        errors: result?.errors || 0,
        skipped: result?.skipped || 0
      })

      setStep(IMPORT_STEPS.COMPLETE)
    } catch (err) {
      console.error('[Import] Import error:', err)
      setError(err.message || 'فشل في استيراد البيانات')
      setStep(IMPORT_STEPS.PREVIEW)
    } finally {
      setIsProcessing(false)
    }
  }, [previewData, onImport])

  // Reset to start
  const handleReset = useCallback(() => {
    setStep(IMPORT_STEPS.UPLOAD)
    setFile(null)
    setRawData([])
    setHeaders([])
    setColumnMapping({})
    setPreviewData([])
    setImportStats(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case IMPORT_STEPS.UPLOAD:
        return (
          <div className="upload-step">
            <div
              className={`drop-zone ${isProcessing ? 'processing' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                hidden
              />
              {isProcessing ? (
                <>
                  <div className="spinner"></div>
                  <p>جاري قراءة الملف...</p>
                </>
              ) : (
                <>
                  <span className="upload-icon">📤</span>
                  <p>اسحب ملف Excel هنا أو انقر للاختيار</p>
                  <span className="file-types">.xlsx, .xls</span>
                </>
              )}
            </div>
            {error && (
              <div className="import-error">
                <span>⚠️</span> {error}
              </div>
            )}
          </div>
        )

      case IMPORT_STEPS.MAP:
        return (
          <div className="map-step">
            <div className="file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{file?.name}</span>
              <span className="row-count">{rawData.length} صف</span>
            </div>
            <ColumnMapper
              excelHeaders={headers}
              dbColumns={columns}
              mapping={columnMapping}
              onMappingChange={handleMappingChange}
              onClearMapping={handleClearMapping}
            />
          </div>
        )

      case IMPORT_STEPS.PREVIEW:
        return (
          <div className="preview-step">
            <div className="preview-header">
              <span className="preview-count">{previewData.length} صف جاهز للاستيراد</span>
              <span className="mapped-count">
                {Object.keys(columnMapping).length} حقل تم ربطه
              </span>
            </div>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {Object.values(columnMapping).filter(Boolean).slice(0, 6).map(field => (
                      <th key={field}>{field}</th>
                    ))}
                    {Object.values(columnMapping).filter(Boolean).length > 6 && (
                      <th>...</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {Object.values(columnMapping).filter(Boolean).slice(0, 6).map(field => (
                        <td key={field}>{String(row[field] || '')}</td>
                      ))}
                      {Object.values(columnMapping).filter(Boolean).length > 6 && (
                        <td>...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <div className="preview-more">
                  و {previewData.length - 10} صف إضافي...
                </div>
              )}
            </div>
            {error && (
              <div className="import-error">
                <span>⚠️</span> {error}
              </div>
            )}
          </div>
        )

      case IMPORT_STEPS.IMPORT:
        return (
          <div className="import-step">
            <div className="import-progress">
              <div className="spinner-large"></div>
              <p>جاري استيراد البيانات...</p>
              <span className="progress-count">{previewData.length} صف</span>
            </div>
          </div>
        )

      case IMPORT_STEPS.COMPLETE:
        return (
          <div className="complete-step">
            <div className="success-icon">✓</div>
            <h3>تم الاستيراد بنجاح!</h3>
            <div className="import-stats">
              <div className="stat">
                <span className="stat-value">{importStats?.imported || 0}</span>
                <span className="stat-label">تم استيراده</span>
              </div>
              {importStats?.skipped > 0 && (
                <div className="stat warning">
                  <span className="stat-value">{importStats.skipped}</span>
                  <span className="stat-label">تم تخطيه</span>
                </div>
              )}
              {importStats?.errors > 0 && (
                <div className="stat error">
                  <span className="stat-value">{importStats.errors}</span>
                  <span className="stat-label">أخطاء</span>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Get footer buttons based on step
  const renderFooterButtons = () => {
    switch (step) {
      case IMPORT_STEPS.UPLOAD:
        return (
          <button className="btn-cancel" onClick={onClose}>
            إغلاق
          </button>
        )

      case IMPORT_STEPS.MAP:
        return (
          <>
            <button className="btn-cancel" onClick={handleReset}>
              رجوع
            </button>
            <button
              className="btn-next"
              onClick={handlePreview}
              disabled={Object.values(columnMapping).filter(Boolean).length === 0}
            >
              معاينة →
            </button>
          </>
        )

      case IMPORT_STEPS.PREVIEW:
        return (
          <>
            <button className="btn-cancel" onClick={() => setStep(IMPORT_STEPS.MAP)}>
              رجوع
            </button>
            <button
              className="btn-import"
              onClick={handleImport}
              disabled={isProcessing}
            >
              استيراد {previewData.length} صف
            </button>
          </>
        )

      case IMPORT_STEPS.COMPLETE:
        return (
          <>
            <button className="btn-cancel" onClick={handleReset}>
              استيراد آخر
            </button>
            <button className="btn-done" onClick={onClose}>
              تم
            </button>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="import-overlay" onClick={onClose}>
      <div className="import-modal" onClick={e => e.stopPropagation()}>
        <div className="import-header">
          <div className="header-info">
            <span className="header-icon">📥</span>
            <h3>استيراد من Excel</h3>
          </div>
          <div className="step-indicator">
            <span className={step === IMPORT_STEPS.UPLOAD ? 'active' : step !== IMPORT_STEPS.UPLOAD ? 'done' : ''}>رفع</span>
            <span className="separator">→</span>
            <span className={step === IMPORT_STEPS.MAP ? 'active' : [IMPORT_STEPS.PREVIEW, IMPORT_STEPS.IMPORT, IMPORT_STEPS.COMPLETE].includes(step) ? 'done' : ''}>ربط</span>
            <span className="separator">→</span>
            <span className={step === IMPORT_STEPS.PREVIEW ? 'active' : [IMPORT_STEPS.IMPORT, IMPORT_STEPS.COMPLETE].includes(step) ? 'done' : ''}>معاينة</span>
            <span className="separator">→</span>
            <span className={step === IMPORT_STEPS.COMPLETE ? 'active done' : ''}>تم</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="import-content">
          {renderStepContent()}
        </div>

        <div className="import-footer">
          {renderFooterButtons()}
        </div>
      </div>
    </div>
  )
}

export default ImportModal
