/**
 * Transform Import Page
 * Upload Excel files with different formats and transform them to standard schema
 */

import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import MainLayout from '../../../components/Layout/MainLayout'
import { Card } from '../../../components/UI'
import transformationEngine, { DB_SCHEMA } from '../../../services/transformationEngine'
import { importService } from '../../../services/importService'
import './TransformImport.css'

const TransformImport = () => {
  const { t } = useTranslation()
  
  // State
  const [file, setFile] = useState(null)
  const [rawData, setRawData] = useState([])
  const [headers, setHeaders] = useState([])
  const [detectedTemplate, setDetectedTemplate] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [customMapping, setCustomMapping] = useState({})
  const [transformedData, setTransformedData] = useState([])
  const [validationResult, setValidationResult] = useState(null)
  const [step, setStep] = useState(1) // 1: Upload, 2: Map, 3: Preview, 4: Import
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  // Handle file upload
  const handleFileUpload = useCallback(async (e) => {
    const uploadedFile = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!uploadedFile) return

    if (!uploadedFile.name.endsWith('.xlsx') && !uploadedFile.name.endsWith('.xlsm')) {
      setError('Please upload an Excel file (.xlsx or .xlsm)')
      return
    }

    setFile(uploadedFile)
    setError(null)

    try {
      // Read Excel file
      const data = await uploadedFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        setError('Excel file is empty')
        return
      }

      // Extract headers
      const fileHeaders = Object.keys(jsonData[0])
      setHeaders(fileHeaders)
      setRawData(jsonData)

      // Auto-detect template
      const detected = transformationEngine.detectTemplate(fileHeaders)
      setDetectedTemplate(detected)
      setSelectedTemplate(detected)

      // Move to mapping step
      setStep(2)
    } catch (err) {
      console.error('Error reading Excel:', err)
      setError('Failed to read Excel file: ' + err.message)
    }
  }, [])

  // Handle template selection
  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey)
    setCustomMapping({})
  }

  // Handle custom mapping change
  const handleMappingChange = (excelColumn, dbField) => {
    setCustomMapping(prev => ({
      ...prev,
      [excelColumn]: dbField
    }))
  }

  // Apply transformation
  const handleTransform = () => {
    try {
      let templateKey = selectedTemplate

      // Use custom mapping if no template selected
      if (!selectedTemplate || Object.keys(customMapping).length > 0) {
        templateKey = transformationEngine.createCustomMapping(customMapping)
      }

      // Transform data
      const transformed = transformationEngine.transformDataset(rawData, templateKey)
      setTransformedData(transformed)

      // Validate
      const validation = transformationEngine.validateData(transformed)
      setValidationResult(validation)

      // Move to preview step
      setStep(3)
    } catch (err) {
      console.error('Transformation error:', err)
      setError('Transformation failed: ' + err.message)
    }
  }

  // Import transformed data
  const handleImport = async () => {
    setImporting(true)
    setProgress(0)

    try {
      await importService.uploadSites(transformedData, (percentage) => {
        setProgress(percentage)
      })

      setStep(4) // Success step
    } catch (err) {
      console.error('Import error:', err)
      setError('Import failed: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  // Reset everything
  const handleReset = () => {
    setFile(null)
    setRawData([])
    setHeaders([])
    setDetectedTemplate(null)
    setSelectedTemplate(null)
    setCustomMapping({})
    setTransformedData([])
    setValidationResult(null)
    setStep(1)
    setProgress(0)
    setError(null)
  }

  // Get available templates
  const templates = transformationEngine.getAllTemplates()

  return (
    <MainLayout>
      <div className="transform-import-page">
        <div className="page-header">
          <h1>🔄 Transform & Import</h1>
          <p>Upload Excel files with different formats and transform to standard schema</p>
        </div>

        {error && (
          <div className="alert-error">
            ⚠️ {error}
          </div>
        )}

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Upload File</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Map Fields</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Preview</div>
          </div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Import</div>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <Card className="upload-card">
            <h2>📤 Upload Excel File</h2>
            <p>Upload an Excel file with any column structure</p>
            
            <input
              type="file"
              accept=".xlsx,.xlsm"
              onChange={handleFileUpload}
              className="file-input"
            />

            <div className="template-info">
              <h3>Supported Formats:</h3>
              <ul>
                {Object.entries(templates).map(([key, template]) => (
                  <li key={key}>
                    <strong>{template.name}</strong>: {template.description}
                  </li>
                ))}
                <li><strong>Custom</strong>: Any Excel format (manual mapping required)</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Step 2: Mapping */}
        {step === 2 && (
          <div className="mapping-section">
            <Card className="template-selection">
              <h2>📋 Select Template or Map Manually</h2>
              
              {detectedTemplate && (
                <div className="detected-template">
                  ✅ Auto-detected: <strong>{templates[detectedTemplate].name}</strong>
                </div>
              )}

              <div className="template-buttons">
                {Object.entries(templates).map(([key, template]) => (
                  <button
                    key={key}
                    className={`template-btn ${selectedTemplate === key ? 'active' : ''}`}
                    onClick={() => handleTemplateSelect(key)}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="mapping-table-card">
              <h3>Field Mapping</h3>
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Excel Column</th>
                    <th>→</th>
                    <th>Database Field</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map(header => {
                    const template = selectedTemplate ? templates[selectedTemplate] : null
                    const autoMapped = template?.mapping[header]
                    const customMapped = customMapping[header]
                    
                    return (
                      <tr key={header}>
                        <td><code>{header}</code></td>
                        <td>→</td>
                        <td>
                          <select
                            value={customMapped || autoMapped || ''}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            className="mapping-select"
                          >
                            <option value="">-- Skip --</option>
                            {Object.entries(DB_SCHEMA).map(([field, label]) => (
                              <option key={field} value={field}>
                                {label} ({field})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="mapping-actions">
                <button onClick={handleReset} className="btn-secondary">
                  ← Back
                </button>
                <button onClick={handleTransform} className="btn-primary">
                  Transform Data →
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="preview-section">
            {validationResult && (
              <Card className="validation-card">
                <h2>
                  {validationResult.valid ? '✅' : '❌'} Validation Results
                </h2>
                
                {validationResult.errors.length > 0 && (
                  <div className="validation-errors">
                    <h3>Errors ({validationResult.errors.length}):</h3>
                    <ul>
                      {validationResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div className="validation-warnings">
                    <h3>Warnings ({validationResult.warnings.length}):</h3>
                    <ul>
                      {validationResult.warnings.slice(0, 10).map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                      {validationResult.warnings.length > 10 && (
                        <li>... and {validationResult.warnings.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            <Card className="preview-card">
              <h2>📊 Preview Transformed Data</h2>
              <p>{transformedData.length} records ready for import</p>

              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Site ID</th>
                      <th>Site Name</th>
                      <th>Governorate</th>
                      <th>Phase</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformedData.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.site_id}</td>
                        <td>{row.final_site_name}</td>
                        <td>{row.governorate}</td>
                        <td>{row.phase_name}</td>
                        <td>{row.tssr_overall_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="preview-actions">
                <button onClick={() => setStep(2)} className="btn-secondary">
                  ← Back to Mapping
                </button>
                <button
                  onClick={handleImport}
                  className="btn-primary"
                  disabled={!validationResult?.valid || importing}
                >
                  {importing ? `Importing ${progress}%` : `Import ${transformedData.length} Records`}
                </button>
              </div>

              {importing && (
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="success-card">
            <div className="success-icon">✅</div>
            <h2>Import Completed Successfully!</h2>
            <p>{transformedData.length} records have been imported</p>
            
            <div className="success-actions">
              <button onClick={handleReset} className="btn-primary">
                Import Another File
              </button>
              <button onClick={() => window.location.href = '/admin/sites'} className="btn-secondary">
                View Sites
              </button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

export default TransformImport
