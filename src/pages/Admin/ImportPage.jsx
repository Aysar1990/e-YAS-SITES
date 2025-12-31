import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../components/UI'
import { importService } from '../../services/importService'
import MainLayout from '../../components/Layout/MainLayout'
import './styles/import/import-page.css'

const ImportPage = () => {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null) 
  const [parsedData, setParsedData] = useState([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xlsm'))) {
      setFile(droppedFile)
      
      try {
        const result = await importService.parseExcelFile(droppedFile)
        setAnalysis({
          totalSites: result.totalSites,
          columns: result.columns,
          phases: result.phases,
          preview: result.preview
        })
        setParsedData(result.data)
      } catch (err) {
        console.error(err)
        setError('Failed to analyze file. Please ensure it is a valid Excel file.')
        setFile(null)
      }

    } else {
      setError('Please drop a valid Excel file (.xlsx or .xlsm)')
    }
  }, [])

  const [importSuccess, setImportSuccess] = useState(false)

  const handleStartImport = async () => {
    if (!parsedData.length) return

    setImporting(true)
    setProgress(0)
    setError(null)
    
    try {
      await importService.uploadSites(parsedData, (percentage) => {
        setProgress(percentage)
      })
      
      setImportSuccess(true)
      // Do not reset logic here, let the user choose to reset or navigate
    } catch (err) {
      console.error(err)
      setError('Import failed: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setAnalysis(null)
    setParsedData([])
    setError(null)
    setImportSuccess(false)
    setProgress(0)
  }

  return (
    <MainLayout>
      <div className="import-page">
        <div className="page-header">
          <h1 className="page-title">{t('common.import', 'Data Import')}</h1>
          <p className="page-subtitle">Update system data from TSSR Excel Tracker</p>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '20px', padding: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="import-grid">
          { importSuccess ? (
             <Card className="success-card fade-in" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                <h2>Import Completed Successfully!</h2>
                <p style={{ color: '#ccc', marginBottom: '30px' }}>{parsedData.length} records have been updated in the database.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={handleReset}>Import Another File</button>
                    <button className="btn-secondary" onClick={() => window.location.href = '/sites'}>View Sites</button>
                </div>
             </Card>
          ) : (
             <>
                {/* LEFT: Drop Zone */}
                <div className="import-section-main">
                    {/* ... Existing Drop Zone & Analysis ... */}
                    <div 
                    className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    >
                    <div className="drop-zone-content">
                        <div className="icon-wrapper">
                        {file ? '📄' : '📊'}
                        </div>
                        <h3>{file ? file.name : 'Drag & Drop Excel File'}</h3>
                        <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Supports .xlsx, .xlsm'}</p>
                        
                        {!file && (
                        <>
                            <input
                            type="file"
                            id="excel-upload"
                            style={{ display: 'none' }}
                            accept=".xlsx, .xlsm"
                            onChange={(e) => {
                                const selectedFile = e.target.files[0];
                                if (selectedFile) {
                                    const event = { preventDefault: () => {}, dataTransfer: { files: [selectedFile] } };
                                    handleDrop(event);
                                }
                            }}
                            />
                            <button 
                                className="btn-browse" 
                                onClick={() => document.getElementById('excel-upload').click()}
                            >
                                Browse Files
                            </button>
                        </>
                        )}
                    </div>
                    </div>

                    {/* Analysis Result */}
                    {analysis && (
                    <Card className="analysis-card fade-in">
                        <div className="analysis-header">
                        <h3>Analysis Result</h3>
                        <span className="badge-success">Ready to Import</span>
                        </div>
                        
                        <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-label">Total Sites</span>
                            <span className="stat-value">{analysis.totalSites.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Columns</span>
                            <span className="stat-value">{analysis.columns}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Phases Found</span>
                            <span className="stat-value">{Object.keys(analysis.phases).length}</span>
                        </div>
                        </div>

                        <h4>Preview Data</h4>
                        <div className="preview-table-wrapper">
                        <table className="preview-table">
                            <thead>
                            <tr>
                                <th>Site ID</th>
                                <th>Name</th>
                                <th>Phase</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {analysis.preview.map((row, idx) => (
                                <tr key={idx}>
                                <td>{row.siteId}</td>
                                <td>{row.finalSiteName}</td>
                                <td><span className="badge-phase">{row.phaseName}</span></td>
                                <td>{row.tssrOverallStatus}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    </Card>
                    )}
                </div>

                {/* RIGHT: Actions */}
                <div className="import-section-sidebar">
                    <Card className="action-card">
                    <h3>Import Actions</h3>
                    <p className="text-muted">Review the analysis before starting.</p>
                    
                    <button 
                        className={`btn-import ${importing ? 'loading' : ''}`}
                        disabled={!analysis || importing}
                        onClick={handleStartImport}
                    >
                        {importing ? `Importing ${progress}%` : 'Start Import'}
                    </button>
                    
                    {importing && (
                        <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                    
                    <button className="btn-secondary" onClick={handleReset}>
                        Reset
                    </button>
                    </Card>

                    <Card className="instruction-card">
                    <h4>⚠️ Important Note</h4>
                    <ul>
                        <li>Ensure no formulas in 'Site ID' column.</li>
                        <li>Hidden rows will be ignored unless specified.</li>
                        <li>This operation will <strong>overwrite</strong> existing site data.</li>
                    </ul>
                    </Card>
                </div>
             </>
          )} 
        </div>
      </div>
    </MainLayout>
  )
}

export default ImportPage
