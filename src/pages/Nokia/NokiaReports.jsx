/**
 * Nokia Reports Page V2.0
 * REFACTORED: Extracted config and export utilities
 * Original: 424 lines → Refactored: ~180 lines
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MainLayout from '../../components/Layout/MainLayout'
import { Card } from '../../components/UI'
import { useData } from '../../context/DataContext'
import { useLanguage } from '../../context/LanguageContext'
import { REPORT_TYPES } from './nokiaReportsConfig'
import {
  generateTssrProgressReport,
  generatePendingReport,
  generateRejectionReport
} from './nokiaExportUtils'
import './NokiaReports.css'

const NokiaReports = () => {
  const { t } = useTranslation()
  const { direction, language } = useLanguage()
  const { sites } = useData()
  const [reports, setReports] = useState([])
  const [selectedType, setSelectedType] = useState('all')
  const [generating, setGenerating] = useState(null)

  const filteredReports = selectedType === 'all'
    ? reports
    : reports.filter((r) => r.type === selectedType)

  const formatDate = (dateStr) => {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US'
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeIcon = (type) => {
    return REPORT_TYPES.find((rt) => rt.id === type)?.icon || '📄'
  }

  const handleGenerateReport = async (typeId) => {
    setGenerating(typeId)
    await new Promise(resolve => setTimeout(resolve, 500))

    let newReport
    switch (typeId) {
      case 'tssrProgress':
        newReport = generateTssrProgressReport(sites, t)
        break
      case 'pendingTssr':
        newReport = generatePendingReport(sites, t)
        break
      case 'rejection':
        newReport = generateRejectionReport(sites, t)
        break
      default:
        break
    }

    if (newReport) {
      setReports(prev => [newReport, ...prev])
    }
    setGenerating(null)
  }

  const handleDeleteReport = (reportId) => {
    setReports(prev => prev.filter(r => r.id !== reportId))
  }

  return (
    <MainLayout>
      <div className="reports-page" dir={direction}>
        <div className="page-header">
          <div className="page-header__info">
            <h1 className="page-title">{t('reports.title')}</h1>
            <p className="page-subtitle">{t('reports.subtitle')}</p>
          </div>
        </div>

        {/* Quick Generate Section */}
        <section className="section">
          <h2 className="section-title">{t('reports.createNew')}</h2>
          <div className="report-types-grid">
            {REPORT_TYPES.map((type) => (
              <Card key={type.id} className="report-type-card">
                <div className="report-type-icon">{type.icon}</div>
                <h3 className="report-type-name">{t(type.nameKey)}</h3>
                <p className="report-type-desc">{t(type.descKey)}</p>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => handleGenerateReport(type.id)}
                  disabled={generating === type.id}
                >
                  {generating === type.id ? t('reports.generating') : t('reports.generate')}
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Reports History */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t('reports.previousReports')}</h2>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('reports.allTypes')}</option>
              {REPORT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>{t(type.nameKey)}</option>
              ))}
            </select>
          </div>

          <Card>
            <div className="table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>{t('reports.table.reportId')}</th>
                    <th>{t('reports.table.reportName')}</th>
                    <th>{t('reports.table.type')}</th>
                    <th>{t('reports.table.createdAt')}</th>
                    <th>{t('reports.table.createdBy')}</th>
                    <th>{t('reports.table.size')}</th>
                    <th>{t('reports.table.status')}</th>
                    <th>{t('reports.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td><span className="report-id">{report.id}</span></td>
                      <td>
                        <div className="report-name-cell">
                          <span className="report-icon">{getTypeIcon(report.type)}</span>
                          <span className="report-name">{report.name}</span>
                        </div>
                      </td>
                      <td>{t(REPORT_TYPES.find((rt) => rt.id === report.type)?.nameKey)}</td>
                      <td>{formatDate(report.generatedAt)}</td>
                      <td>{report.generatedBy}</td>
                      <td>{report.size}</td>
                      <td>
                        <span className={`status-badge status-badge--${report.status === 'ready' ? 'success' : 'warning'}`}>
                          {t(report.status === 'ready' ? 'reports.ready' : 'reports.generating')}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="action-btn action-btn--danger"
                            title={t('common.delete')}
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredReports.length === 0 && (
            <div className="empty-state">
              <p>{t('reports.noReports')}</p>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  )
}

export default NokiaReports
