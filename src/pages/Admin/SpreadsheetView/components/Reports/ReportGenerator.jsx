/**
 * ReportGenerator - PDF Report Generator Modal
 * Phase 7: Visualization
 */

import React, { useState, useMemo, useCallback } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import ReportPreview from './ReportPreview'
import './ReportGenerator.css'

// Report templates
const REPORT_TEMPLATES = [
  { value: 'summary', label: 'تقرير ملخص', description: 'ملخص شامل مع إحصائيات' },
  { value: 'detailed', label: 'تقرير تفصيلي', description: 'جميع البيانات مع التفاصيل' },
  { value: 'status', label: 'تقرير الحالات', description: 'تحليل حالات المواقع' }
]

// Columns for PDF table
const PDF_COLUMNS = [
  { key: 'site_id', label: 'Site ID' },
  { key: 'site_name', label: 'اسم الموقع' },
  { key: 'governorate', label: 'المحافظة' },
  { key: 'tssr_status', label: 'حالة TSSR' },
  { key: 'contractor', label: 'المقاول' }
]

const ReportGenerator = ({ data = [], onClose }) => {
  const [template, setTemplate] = useState('summary')
  const [reportTitle, setReportTitle] = useState('تقرير TSSR')
  const [includeStats, setIncludeStats] = useState(true)
  const [includeCharts, setIncludeCharts] = useState(false)
  const [maxRows, setMaxRows] = useState(100)
  const [generating, setGenerating] = useState(false)

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null

    const total = data.length
    const approved = data.filter(d =>
      d.tssr_status?.toLowerCase().includes('approved') ||
      d.dept_status?.toLowerCase().includes('approved')
    ).length
    const pending = data.filter(d =>
      d.tssr_status?.toLowerCase().includes('pending') ||
      d.tssr_status?.toLowerCase().includes('under')
    ).length
    const rejected = data.filter(d =>
      d.tssr_status?.toLowerCase().includes('rejected') ||
      d.tssr_status?.toLowerCase().includes('rfi')
    ).length

    // Group by governorate
    const byGovernorate = {}
    data.forEach(d => {
      const gov = d.governorate || 'غير محدد'
      byGovernorate[gov] = (byGovernorate[gov] || 0) + 1
    })

    // Group by contractor
    const byContractor = {}
    data.forEach(d => {
      const con = d.contractor || 'غير محدد'
      byContractor[con] = (byContractor[con] || 0) + 1
    })

    return {
      total,
      approved,
      pending,
      rejected,
      approvalRate: ((approved / total) * 100).toFixed(1),
      byGovernorate: Object.entries(byGovernorate)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      byContractor: Object.entries(byContractor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    }
  }, [data])

  // Generate PDF
  const generatePDF = useCallback(async () => {
    if (!data || data.length === 0) return

    setGenerating(true)

    try {
      // Create PDF (A4 Landscape)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Set RTL
      doc.setR2L(true)

      // Colors
      const primaryColor = [143, 217, 217] // #8FD9D9
      const headerBg = [31, 41, 55] // #1F2937

      // Title
      doc.setFontSize(22)
      doc.setTextColor(143, 217, 217)
      doc.text(reportTitle, doc.internal.pageSize.width / 2, 20, { align: 'center' })

      // Date
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      const date = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(`تاريخ التقرير: ${date}`, doc.internal.pageSize.width / 2, 28, { align: 'center' })

      let yPosition = 35

      // Stats Section
      if (includeStats && stats) {
        doc.setFontSize(14)
        doc.setTextColor(255, 255, 255)
        doc.setFillColor(...headerBg)
        doc.rect(10, yPosition, doc.internal.pageSize.width - 20, 10, 'F')
        doc.text('الإحصائيات', doc.internal.pageSize.width / 2, yPosition + 7, { align: 'center' })

        yPosition += 15

        // Stats boxes
        doc.setFontSize(11)
        const boxWidth = 50
        const boxHeight = 20
        const startX = (doc.internal.pageSize.width - (boxWidth * 4 + 30)) / 2

        // Total
        doc.setFillColor(59, 130, 246)
        doc.roundedRect(startX, yPosition, boxWidth, boxHeight, 3, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.text(String(stats.total), startX + boxWidth / 2, yPosition + 10, { align: 'center' })
        doc.setFontSize(9)
        doc.text('إجمالي', startX + boxWidth / 2, yPosition + 16, { align: 'center' })

        // Approved
        doc.setFillColor(34, 197, 94)
        doc.roundedRect(startX + boxWidth + 10, yPosition, boxWidth, boxHeight, 3, 3, 'F')
        doc.setFontSize(14)
        doc.text(String(stats.approved), startX + boxWidth * 1.5 + 10, yPosition + 10, { align: 'center' })
        doc.setFontSize(9)
        doc.text('معتمد', startX + boxWidth * 1.5 + 10, yPosition + 16, { align: 'center' })

        // Pending
        doc.setFillColor(234, 179, 8)
        doc.roundedRect(startX + boxWidth * 2 + 20, yPosition, boxWidth, boxHeight, 3, 3, 'F')
        doc.setFontSize(14)
        doc.text(String(stats.pending), startX + boxWidth * 2.5 + 20, yPosition + 10, { align: 'center' })
        doc.setFontSize(9)
        doc.text('قيد الانتظار', startX + boxWidth * 2.5 + 20, yPosition + 16, { align: 'center' })

        // Rejected
        doc.setFillColor(239, 68, 68)
        doc.roundedRect(startX + boxWidth * 3 + 30, yPosition, boxWidth, boxHeight, 3, 3, 'F')
        doc.setFontSize(14)
        doc.text(String(stats.rejected), startX + boxWidth * 3.5 + 30, yPosition + 10, { align: 'center' })
        doc.setFontSize(9)
        doc.text('مرفوض', startX + boxWidth * 3.5 + 30, yPosition + 16, { align: 'center' })

        yPosition += boxHeight + 10
      }

      // Data Table
      const tableData = data.slice(0, maxRows).map(row => [
        row.site_id || '-',
        row.site_name || '-',
        row.governorate || '-',
        row.tssr_status || '-',
        row.contractor || '-'
      ])

      doc.autoTable({
        head: [PDF_COLUMNS.map(c => c.label)],
        body: tableData,
        startY: yPosition + 5,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3,
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [17, 24, 39],
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246]
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 35 },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 }
        },
        didDrawPage: (data) => {
          // Footer with page numbers
          const pageCount = doc.internal.getNumberOfPages()
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text(
            `صفحة ${data.pageNumber} من ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          )

          // Footer text
          doc.text(
            'e-YAS SITES - TSSR Monitor',
            15,
            doc.internal.pageSize.height - 10
          )
        }
      })

      // Save PDF
      const timestamp = new Date().toISOString().slice(0, 10)
      doc.save(`TSSR_Report_${timestamp}.pdf`)

    } catch (error) {
      console.error('[ReportGenerator] Error generating PDF:', error)
      alert('حدث خطأ أثناء إنشاء التقرير')
    } finally {
      setGenerating(false)
    }
  }, [data, reportTitle, includeStats, stats, maxRows])

  return (
    <div className="report-panel-overlay" onClick={onClose}>
      <div className="report-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="report-panel-header">
          <h2>📄 إنشاء تقرير PDF</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="report-content">
          {/* Config Section */}
          <div className="report-config">
            <h3>إعدادات التقرير</h3>

            {/* Template */}
            <div className="config-group">
              <label>نوع التقرير</label>
              <select
                value={template}
                onChange={e => setTemplate(e.target.value)}
                className="config-select"
              >
                {REPORT_TEMPLATES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="config-hint">
                {REPORT_TEMPLATES.find(t => t.value === template)?.description}
              </span>
            </div>

            {/* Title */}
            <div className="config-group">
              <label>عنوان التقرير</label>
              <input
                type="text"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                className="config-input"
                placeholder="أدخل عنوان التقرير"
              />
            </div>

            {/* Options */}
            <div className="config-group">
              <label>الخيارات</label>
              <div className="config-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeStats}
                    onChange={e => setIncludeStats(e.target.checked)}
                  />
                  <span>تضمين الإحصائيات</span>
                </label>
                <label className="checkbox-label disabled">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={e => setIncludeCharts(e.target.checked)}
                    disabled
                  />
                  <span>تضمين المخططات (قريبًا)</span>
                </label>
              </div>
            </div>

            {/* Max Rows */}
            <div className="config-group">
              <label>الحد الأقصى للصفوف</label>
              <select
                value={maxRows}
                onChange={e => setMaxRows(parseInt(e.target.value))}
                className="config-select small"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
              <span className="config-hint">
                إجمالي السجلات: {data.length}
              </span>
            </div>

            {/* Generate Button */}
            <button
              className="generate-btn"
              onClick={generatePDF}
              disabled={generating || !data.length}
            >
              {generating ? (
                <>
                  <span className="spinner-small"></span>
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  📥 إنشاء PDF
                </>
              )}
            </button>
          </div>

          {/* Preview Section */}
          <div className="report-preview-section">
            <h3>معاينة التقرير</h3>
            <ReportPreview
              title={reportTitle}
              stats={stats}
              data={data}
              maxRows={maxRows}
              includeStats={includeStats}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportGenerator
