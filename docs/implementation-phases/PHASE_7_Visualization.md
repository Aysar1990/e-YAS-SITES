# 📈 **PHASE 7 - Visualization Features**

## 📋 **نظرة عامة**

**الهدف:** إضافة ميزات العرض المرئي للبيانات  
**الوقت المقدر:** 2-3 أيام (بدل 5 أيام)  
**التوفير:** 50%

---

## ✨ **الميزات (3)**

1. ✅ **Embedded Charts** - رسوم بيانية مدمجة
2. ✅ **Sparklines in Cells** - رسوم صغيرة داخل الخلايا
3. ✅ **Custom Reports Generator** - مولد تقارير PDF

---

## 🎯 **استراتيجية التوفير**

### **المكتبات المستخدمة:**
```bash
✅ recharts                  # موجودة مسبقاً
✅ react-sparklines          # مثبتة ✅
✅ jspdf + jspdf-autotable  # مثبتة ✅
```

### **Components المعاد استخدامها:**
```javascript
✅ Modal System (Phase 3)      → Chart Panel
✅ ExportButton (Phase 3)      → PDF Export
✅ QuickStats (Phase 1)        → Chart Data Source
```

### **MVP Approach:**
- Charts: Bar/Line فقط أولاً
- Sparklines: Trend line بسيط
- Reports: 3 تقارير جاهزة

---

## 📦 **Feature 1: Embedded Charts**

### **الوصف:**
إنشاء وعرض رسوم بيانية تفاعلية من بيانات الجدول.

### **المكونات:**

#### **1. ChartPanel Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Charts/ChartPanel.jsx`

```javascript
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import ChartBuilder from './ChartBuilder';
import './Charts.css';

const ChartPanel = ({ isOpen, onClose, data, columns }) => {
  const [chartConfig, setChartConfig] = useState({
    type: 'bar',
    xField: '',
    yField: '',
    title: 'رسم بياني'
  });

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!chartConfig.xField || !chartConfig.yField) return [];

    // Group and aggregate data
    const grouped = {};
    data.forEach(row => {
      const xValue = row[chartConfig.xField];
      if (!xValue) return;

      if (!grouped[xValue]) {
        grouped[xValue] = { name: xValue, value: 0, count: 0 };
      }
      
      const yValue = row[chartConfig.yField];
      if (typeof yValue === 'number') {
        grouped[xValue].value += yValue;
        grouped[xValue].count++;
      } else {
        // For non-numeric, count occurrences
        grouped[xValue].count++;
      }
    });

    return Object.values(grouped).map(item => ({
      name: item.name,
      value: item.value || item.count
    }));
  }, [data, chartConfig.xField, chartConfig.yField]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="chart-empty">
          <p>الرجاء اختيار الحقول لإنشاء الرسم البياني</p>
        </div>
      );
    }

    const COLORS = ['#8FD9D9', '#FF8566', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];

    switch (chartConfig.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8FD9D9" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8FD9D9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8FD9D9"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const handleExport = () => {
    // Export chart as image
    const chartElement = document.querySelector('.chart-display');
    if (!chartElement) return;

    // Use html2canvas or similar library
    alert('ميزة التصدير قريباً');
  };

  if (!isOpen) return null;

  return (
    <div className="chart-overlay" onClick={onClose}>
      <div className="chart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 {chartConfig.title}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="chart-body">
          {/* Chart Builder - Config */}
          <div className="chart-config">
            <ChartBuilder
              config={chartConfig}
              onChange={setChartConfig}
              columns={columns}
            />
          </div>

          {/* Chart Display */}
          <div className="chart-display">
            {renderChart()}
          </div>

          {/* Stats */}
          {chartData.length > 0 && (
            <div className="chart-stats">
              <div className="stat-item">
                <span className="stat-label">عدد الفئات:</span>
                <span className="stat-value">{chartData.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">المجموع:</span>
                <span className="stat-value">
                  {chartData.reduce((sum, item) => sum + item.value, 0)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">المتوسط:</span>
                <span className="stat-value">
                  {(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            إغلاق
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            💾 حفظ كصورة
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;
```

#### **2. ChartBuilder Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Charts/ChartBuilder.jsx`

```javascript
import React from 'react';

const ChartBuilder = ({ config, onChange, columns }) => {
  const chartTypes = [
    { value: 'bar', label: '📊 أعمدة', icon: '📊' },
    { value: 'line', label: '📈 خطي', icon: '📈' },
    { value: 'pie', label: '🥧 دائري', icon: '🥧' }
  ];

  return (
    <div className="chart-builder">
      <div className="form-group">
        <label>عنوان الرسم البياني:</label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="form-input"
          placeholder="أدخل العنوان"
        />
      </div>

      <div className="form-group">
        <label>نوع الرسم:</label>
        <div className="chart-type-selector">
          {chartTypes.map(type => (
            <button
              key={type.value}
              className={`type-btn ${config.type === type.value ? 'active' : ''}`}
              onClick={() => onChange({ ...config, type: type.value })}
            >
              <span className="type-icon">{type.icon}</span>
              <span className="type-label">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>المحور X (الفئات):</label>
        <select
          value={config.xField}
          onChange={(e) => onChange({ ...config, xField: e.target.value })}
          className="form-select"
        >
          <option value="">-- اختر الحقل --</option>
          {columns.map(col => (
            <option key={col.field} value={col.field}>
              {col.headerName}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>المحور Y (القيم):</label>
        <select
          value={config.yField}
          onChange={(e) => onChange({ ...config, yField: e.target.value })}
          className="form-select"
        >
          <option value="">-- اختر الحقل --</option>
          {columns.map(col => (
            <option key={col.field} value={col.field}>
              {col.headerName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ChartBuilder;
```

#### **3. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/Charts/Charts.css`

```css
/* Chart Panel */
.chart-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.chart-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Chart Builder */
.chart-builder {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

.chart-type-selector {
  display: flex;
  gap: 12px;
}

.type-btn {
  flex: 1;
  padding: 12px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.type-btn:hover {
  border-color: #8FD9D9;
  transform: translateY(-2px);
}

.type-btn.active {
  border-color: #8FD9D9;
  background: #E3F2FD;
}

.type-icon {
  font-size: 28px;
}

.type-label {
  font-size: 13px;
  color: #666;
}

/* Chart Display */
.chart-display {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-empty {
  text-align: center;
  color: #999;
  padding: 60px 20px;
}

/* Chart Stats */
.chart-stats {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #8FD9D9;
}
```

---

## 📦 **Feature 2: Sparklines in Cells**

### **الوصف:**
رسوم بيانية صغيرة داخل خلايا الجدول لعرض الاتجاهات.

### **المكونات:**

#### **1. SparklineCell Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Sparklines/SparklineCell.jsx`

```javascript
import React from 'react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import './Sparklines.css';

const SparklineCell = ({ data, color = '#8FD9D9', showSpots = false }) => {
  // data is array of numbers, e.g. [10, 20, 15, 30, 25]
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <span className="no-data">—</span>;
  }

  return (
    <div className="sparkline-cell">
      <Sparklines data={data} width={80} height={30}>
        <SparklinesLine color={color} style={{ strokeWidth: 2 }} />
        {showSpots && <SparklinesSpots />}
      </Sparklines>
      <span className="current-value">{data[data.length - 1]}</span>
    </div>
  );
};

export default SparklineCell;
```

#### **2. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/Sparklines/Sparklines.css`

```css
.sparkline-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
}

.sparkline-cell .current-value {
  font-weight: 600;
  color: #333;
  font-size: 13px;
  min-width: 30px;
}

.no-data {
  color: #ccc;
  font-size: 16px;
}
```

#### **3. Integration with AG Grid:**

```javascript
// In columns.js or SpreadsheetView.jsx

import SparklineCell from './components/Sparklines/SparklineCell';

// Add sparkline column
{
  headerName: 'Status Trend',
  field: 'status_history',
  width: 150,
  cellRenderer: (params) => {
    // status_history should be array of numeric values
    // Example: [1, 2, 2, 3, 3] where 1=Pending, 2=Review, 3=Approved
    const data = params.value;
    return <SparklineCell data={data} color="#8FD9D9" />;
  }
}

// Or for site visit counts over time
{
  headerName: 'Visit Trend',
  field: 'visit_history',
  width: 150,
  cellRenderer: (params) => {
    return <SparklineCell data={params.value} color="#4CAF50" showSpots />;
  }
}
```

---

## 📦 **Feature 3: Custom Reports Generator**

### **الوصف:**
إنشاء تقارير PDF مخصصة من بيانات الجدول.

### **المكونات:**

#### **1. ReportGenerator Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Reports/ReportGenerator.jsx`

```javascript
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ReportPreview from './ReportPreview';
import './Reports.css';

const ReportGenerator = ({ isOpen, onClose, data }) => {
  const [reportConfig, setReportConfig] = useState({
    title: 'TSSR Status Report',
    subtitle: `Generated on ${new Date().toLocaleDateString('ar-JO')}`,
    includeStats: true,
    includeChart: true,
    columns: []
  });

  const reportTemplates = [
    {
      id: 'status_summary',
      name: 'ملخص الحالات',
      description: 'تقرير بحالات المواقع حسب القسم',
      icon: '📊'
    },
    {
      id: 'governorate_summary',
      name: 'ملخص المحافظات',
      description: 'توزيع المواقع حسب المحافظة',
      icon: '🗺️'
    },
    {
      id: 'contractor_summary',
      name: 'ملخص المقاولين',
      description: 'المواقع حسب المقاول',
      icon: '👷'
    }
  ];

  const generatePDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

    // Add Arabic font support (if available)
    // doc.addFileToVFS("Amiri-Regular.ttf", amiriFont);
    // doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    // doc.setFont("Amiri");

    // Header
    doc.setFontSize(20);
    doc.text(reportConfig.title, 15, 15);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(reportConfig.subtitle, 15, 25);

    // Stats
    if (reportConfig.includeStats) {
      const stats = calculateStats(data);
      let yPos = 35;

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Statistics:', 15, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.text(`Total Sites: ${stats.total}`, 20, yPos);
      yPos += 6;
      doc.text(`Approved: ${stats.approved}`, 20, yPos);
      yPos += 6;
      doc.text(`Pending: ${stats.pending}`, 20, yPos);
      yPos += 15;
    }

    // Table
    const tableData = data.slice(0, 100).map(row => [
      row.site_id || '',
      row.final_site_name || '',
      row.governorate || '',
      row.tssr_status || '',
      row.ti_status || '',
      row.rf_plan_status || ''
    ]);

    doc.autoTable({
      startY: reportConfig.includeStats ? 70 : 35,
      head: [['Site ID', 'Site Name', 'Governorate', 'TSSR Status', 'TI Status', 'RF Status']],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [143, 217, 217],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    doc.save(`TSSR_Report_${Date.now()}.pdf`);
    alert('تم إنشاء التقرير بنجاح!');
  };

  const calculateStats = (data) => {
    return {
      total: data.length,
      approved: data.filter(d => d.tssr_status === 'Approved').length,
      pending: data.filter(d => d.tssr_status === 'Pending').length,
      rejected: data.filter(d => d.tssr_status === 'Rejected').length
    };
  };

  const selectTemplate = (templateId) => {
    switch (templateId) {
      case 'status_summary':
        setReportConfig({
          ...reportConfig,
          title: 'TSSR Status Summary Report',
          columns: ['site_id', 'final_site_name', 'tssr_status', 'ti_status']
        });
        break;
      case 'governorate_summary':
        setReportConfig({
          ...reportConfig,
          title: 'Sites by Governorate Report',
          columns: ['governorate', 'site_id', 'final_site_name', 'tssr_status']
        });
        break;
      case 'contractor_summary':
        setReportConfig({
          ...reportConfig,
          title: 'Sites by Contractor Report',
          columns: ['tssr_subcon', 'site_id', 'final_site_name', 'tssr_status']
        });
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📄 إنشاء تقرير</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Templates */}
          <div className="report-templates">
            <h4>اختر قالب التقرير:</h4>
            <div className="templates-grid">
              {reportTemplates.map(template => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => selectTemplate(template.id)}
                >
                  <div className="template-icon">{template.icon}</div>
                  <h5>{template.name}</h5>
                  <p>{template.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Config */}
          <div className="report-config">
            <div className="form-group">
              <label>عنوان التقرير:</label>
              <input
                type="text"
                value={reportConfig.title}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  title: e.target.value
                })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reportConfig.includeStats}
                  onChange={(e) => setReportConfig({
                    ...reportConfig,
                    includeStats: e.target.checked
                  })}
                />
                تضمين الإحصائيات
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reportConfig.includeChart}
                  onChange={(e) => setReportConfig({
                    ...reportConfig,
                    includeChart: e.target.checked
                  })}
                />
                تضمين الرسوم البيانية
              </label>
            </div>
          </div>

          {/* Preview */}
          <ReportPreview config={reportConfig} data={data.slice(0, 5)} />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button className="btn btn-primary" onClick={generatePDF}>
            📥 تحميل PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
```

#### **2. ReportPreview Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Reports/ReportPreview.jsx`

```javascript
import React from 'react';

const ReportPreview = ({ config, data }) => {
  return (
    <div className="report-preview">
      <h4>معاينة التقرير:</h4>
      <div className="preview-content">
        <div className="preview-header">
          <h3>{config.title}</h3>
          <p>{config.subtitle}</p>
        </div>

        {config.includeStats && (
          <div className="preview-stats">
            <div className="stat">إجمالي المواقع: {data.length}</div>
            <div className="stat">معتمد: {data.filter(d => d.tssr_status === 'Approved').length}</div>
          </div>
        )}

        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>Site ID</th>
                <th>Site Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 3).map((row, i) => (
                <tr key={i}>
                  <td>{row.site_id}</td>
                  <td>{row.final_site_name}</td>
                  <td>{row.tssr_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="preview-note">... والمزيد</p>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
```

#### **3. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/Reports/Reports.css`

```css
/* Report Panel */
.report-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* Templates */
.report-templates {
  margin-bottom: 24px;
}

.report-templates h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #555;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.template-card {
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #8FD9D9;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(143, 217, 217, 0.2);
}

.template-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.template-card h5 {
  margin: 0 0 8px 0;
  font-size: 15px;
  color: #333;
}

.template-card p {
  margin: 0;
  font-size: 12px;
  color: #999;
}

/* Report Config */
.report-config {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

/* Report Preview */
.report-preview {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.report-preview h4 {
  margin: 0;
  padding: 12px 16px;
  background: #f9f9f9;
  font-size: 14px;
  color: #555;
  border-bottom: 1px solid #e0e0e0;
}

.preview-content {
  padding: 20px;
  background: white;
}

.preview-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.preview-header p {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.preview-stats {
  display: flex;
  gap: 20px;
  margin: 16px 0;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.preview-stats .stat {
  font-size: 13px;
  color: #666;
}

.preview-table {
  margin-top: 16px;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th,
.preview-table td {
  padding: 8px;
  text-align: right;
  border-bottom: 1px solid #f0f0f0;
}

.preview-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #555;
}

.preview-note {
  text-align: center;
  font-size: 12px;
  color: #999;
  font-style: italic;
  margin: 12px 0 0 0;
}
```

---

## ✅ **Testing Checklist**

### **Embedded Charts:**
- [ ] Chart panel opens
- [ ] Select X and Y fields
- [ ] Bar chart displays correctly
- [ ] Line chart displays correctly
- [ ] Pie chart displays correctly
- [ ] Stats show correct calculations
- [ ] Export image works

### **Sparklines:**
- [ ] Sparklines render in cells
- [ ] Trend line shows correct direction
- [ ] Current value displays
- [ ] Color customization works
- [ ] Performance OK with many rows

### **Reports:**
- [ ] Report templates load
- [ ] Select template updates config
- [ ] Preview shows sample data
- [ ] PDF generates successfully
- [ ] PDF contains all selected data
- [ ] Arabic text displays correctly (if font added)

---

## 🎯 **Claude Code Prompt**

```
أنشئ ميزات Visualization للـ SpreadsheetView:

1. Embedded Charts - رسوم بيانية (Bar, Line, Pie)
2. Sparklines in Cells - رسوم صغيرة بالخلايا
3. Custom Reports - مولد تقارير PDF

استخدم:
- recharts (موجودة)
- react-sparklines
- jspdf + jspdf-autotable

المكونات:
- ChartPanel.jsx + ChartBuilder.jsx
- SparklineCell.jsx
- ReportGenerator.jsx + ReportPreview.jsx

YAS colors, Arabic UI, responsive.
راجع PHASE_7_Visualization.md للتفاصيل.
```

---

**Next:** `PHASE_8_Power_Features.md` ⚡
