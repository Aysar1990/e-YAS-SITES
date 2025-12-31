/**
 * ReportPreview - Preview component for PDF report
 * Phase 7: Visualization
 */

import React from 'react'

const ReportPreview = ({ title, stats, data = [], maxRows, includeStats }) => {
  const displayCount = Math.min(data.length, maxRows)

  return (
    <div className="report-preview">
      {/* Header Preview */}
      <div className="preview-header">
        <h2 className="preview-title">{title || 'تقرير TSSR'}</h2>
        <p className="preview-date">
          {new Date().toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Preview */}
      {includeStats && stats && (
        <div className="preview-stats">
          <div className="stat-card total">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">إجمالي</span>
          </div>
          <div className="stat-card approved">
            <span className="stat-number">{stats.approved}</span>
            <span className="stat-label">معتمد</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">قيد الانتظار</span>
          </div>
          <div className="stat-card rejected">
            <span className="stat-number">{stats.rejected}</span>
            <span className="stat-label">مرفوض</span>
          </div>
        </div>
      )}

      {/* Table Preview Info */}
      <div className="preview-table-info">
        <div className="table-icon">📊</div>
        <div className="table-details">
          <p className="table-title">جدول البيانات</p>
          <p className="table-desc">
            سيتضمن التقرير <strong>{displayCount}</strong> سجل
            {displayCount < data.length && (
              <span className="truncated"> (من أصل {data.length})</span>
            )}
          </p>
          <p className="table-columns">
            الأعمدة: Site ID، اسم الموقع، المحافظة، حالة TSSR، المقاول
          </p>
        </div>
      </div>

      {/* Sample Table */}
      <div className="preview-sample-table">
        <table>
          <thead>
            <tr>
              <th>Site ID</th>
              <th>اسم الموقع</th>
              <th>المحافظة</th>
              <th>الحالة</th>
              <th>المقاول</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 3).map((row, idx) => (
              <tr key={idx}>
                <td>{row.site_id || '-'}</td>
                <td>{row.site_name?.substring(0, 20) || '-'}</td>
                <td>{row.governorate || '-'}</td>
                <td>{row.tssr_status || '-'}</td>
                <td>{row.contractor || '-'}</td>
              </tr>
            ))}
            {data.length > 3 && (
              <tr className="more-rows">
                <td colSpan={5}>
                  ... و {displayCount - 3} سجل آخر
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Preview */}
      <div className="preview-footer">
        <span className="footer-brand">e-YAS SITES</span>
        <span className="footer-page">صفحة 1</span>
      </div>
    </div>
  )
}

export default ReportPreview
