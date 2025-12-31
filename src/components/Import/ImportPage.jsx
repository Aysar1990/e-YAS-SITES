import { useState } from 'react'
import MainLayout from '../Layout/MainLayout'
import BatchImport from './BatchImport'
import SingleFileImport from './SingleFileImport'
import './ImportPage.css'

const ImportPage = () => {
  const [activeTab, setActiveTab] = useState('batch') // 'batch' or 'single'

  return (
    <MainLayout>
      <div className="import-page-container">
        {/* Page Header */}
        <div className="import-page-header">
          <div className="header-content">
            <h1 className="page-title">📊 Data Import</h1>
            <p className="page-subtitle">
              Import site data from Excel files into the TSSR Monitor system
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="import-tabs">
          <button
            className={`tab-button ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch')}
          >
            <span className="tab-icon">📦</span>
            <span className="tab-label">Batch Import</span>
            <span className="tab-description">Import multiple files at once</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            <span className="tab-icon">📄</span>
            <span className="tab-label">Single File Import</span>
            <span className="tab-description">Import one file with detailed preview</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="import-tab-content">
          {activeTab === 'batch' ? <BatchImport /> : <SingleFileImport />}
        </div>

        {/* Instructions Section */}
        <div className="import-instructions">
          <h3>📋 Import Instructions</h3>
          <div className="instruction-grid">
            <div className="instruction-card">
              <div className="instruction-icon">1️⃣</div>
              <h4>Prepare Your File</h4>
              <p>
                Ensure your Excel file (.xlsx or .xlsm) contains the required columns:
                Site ID, Site Name, Phase, Status, etc.
              </p>
            </div>
            <div className="instruction-card">
              <div className="instruction-icon">2️⃣</div>
              <h4>Choose Import Type</h4>
              <p>
                Use <strong>Batch Import</strong> for multiple files or{' '}
                <strong>Single File</strong> for detailed preview before import.
              </p>
            </div>
            <div className="instruction-card">
              <div className="instruction-icon">3️⃣</div>
              <h4>Review & Import</h4>
              <p>
                Review the file information and validation status, then click Import
                to update the database.
              </p>
            </div>
          </div>

          <div className="warning-box">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Important Notes</h4>
              <ul>
                <li>Importing will update existing sites based on Site ID</li>
                <li>New sites will be added automatically</li>
                <li>Backup your data before importing large datasets</li>
                <li>All import activities are logged for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default ImportPage
