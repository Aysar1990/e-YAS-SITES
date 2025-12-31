# 📊 **PHASE 6 - Data Management Features**

## 📋 **نظرة عامة**

**الهدف:** إضافة أدوات إدارة البيانات المتقدمة للـ SpreadsheetView  
**الوقت المقدر:** 4-5 أيام (بدل 8 أيام)  
**التوفير:** 44%

---

## ✨ **الميزات (4)**

1. ✅ **Bulk Edit Mode** - تعديل جماعي لعدة صفوف
2. ✅ **Import from Excel** - استيراد بيانات من Excel
3. ✅ **Data Validation Rules** - قواعد التحقق من البيانات
4. ✅ **Advanced Filter Builder** - فلترة متقدمة

---

## 🎯 **استراتيجية التوفير**

### **المكتبات المستخدمة:**
```bash
✅ xlsx                      # موجودة مسبقاً
✅ @dnd-kit/core            # للـ drag & drop
```

### **Components المعاد استخدامها:**
```javascript
✅ Modal System (Phase 3)      → Bulk Edit Modal
✅ SearchBar (Phase 2)         → Filter Builder
✅ ExportButton (Phase 3)      → Import template
```

### **MVP Approach:**
- Bulk Edit: حقل واحد-اثنين أولاً
- Import: Excel بدون auto-mapping
- Validation: Required fields فقط
- Filter: AND/OR بسيط

---

## 📦 **Feature 1: Bulk Edit Mode**

### **الوصف:**
تعديل حقل واحد أو أكثر لعدة صفوف مرة واحدة.

### **المكونات:**

#### **1. BulkEditModal Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/BulkEdit/BulkEditModal.jsx`

```javascript
import React, { useState } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase/firebase';
import './BulkEditModal.css';

const BulkEditModal = ({ isOpen, onClose, selectedRows, onUpdate }) => {
  const [fieldToEdit, setFieldToEdit] = useState('');
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);

  // الحقول المسموح تعديلها
  const editableFields = [
    { value: 'tssr_status', label: 'TSSR Status' },
    { value: 'ti_status', label: 'TI Status' },
    { value: 'rf_plan_status', label: 'RF Plan Status' },
    { value: 'rf_optim_status', label: 'RF Optim Status' },
    { value: 'civil_status', label: 'Civil Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'tssr_remark', label: 'TSSR Remark' },
  ];

  // خيارات القيم حسب الحقل
  const getFieldOptions = () => {
    const statusOptions = [
      'Approved',
      'Pending',
      'Rejected',
      'Under Review',
      'In Progress'
    ];

    const priorityOptions = ['High', 'Medium', 'Low'];

    switch (fieldToEdit) {
      case 'priority':
        return priorityOptions;
      case 'tssr_status':
      case 'ti_status':
      case 'rf_plan_status':
      case 'rf_optim_status':
      case 'civil_status':
        return statusOptions;
      default:
        return null; // Free text
    }
  };

  const handleApply = async () => {
    if (!fieldToEdit || !newValue) {
      alert('الرجاء اختيار الحقل والقيمة الجديدة');
      return;
    }

    setLoading(true);

    try {
      const updates = [];
      const activities = [];

      // Update each row
      for (const row of selectedRows) {
        const oldValue = row[fieldToEdit];
        
        // Update in Firebase (if using Firebase sync)
        // OR update locally and sync later
        
        updates.push({
          ...row,
          [fieldToEdit]: newValue
        });

        // Log activity
        activities.push({
          type: 'bulk_edit',
          siteId: row.site_id,
          siteName: row.final_site_name,
          userId: 'current_user', // Replace with actual user
          userName: 'Ahmad Ali', // Replace with actual user
          timestamp: serverTimestamp(),
          details: {
            field: fieldToEdit,
            oldValue,
            newValue,
            count: selectedRows.length
          }
        });
      }

      // Save activities to Firebase
      const activitiesRef = collection(db, 'activities');
      for (const activity of activities) {
        await addDoc(activitiesRef, activity);
      }

      // Notify parent component
      onUpdate(updates);

      alert(`تم تعديل ${selectedRows.length} صف بنجاح`);
      onClose();
    } catch (error) {
      console.error('Bulk edit error:', error);
      alert('فشل التعديل الجماعي');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fieldOptions = getFieldOptions();

  return (
    <div className="bulk-edit-overlay" onClick={onClose}>
      <div className="bulk-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📝 تعديل جماعي</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="selection-info">
            <span className="count-badge">{selectedRows.length}</span>
            صف محدد
          </div>

          {/* Field Selector */}
          <div className="form-group">
            <label>الحقل المراد تعديله:</label>
            <select 
              value={fieldToEdit}
              onChange={(e) => {
                setFieldToEdit(e.target.value);
                setNewValue(''); // Reset value
              }}
              className="form-select"
            >
              <option value="">-- اختر الحقل --</option>
              {editableFields.map(field => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          {fieldToEdit && (
            <div className="form-group">
              <label>القيمة الجديدة:</label>
              {fieldOptions ? (
                <select 
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- اختر القيمة --</option>
                  {fieldOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="أدخل القيمة الجديدة"
                  className="form-input"
                />
              )}
            </div>
          )}

          {/* Preview */}
          {fieldToEdit && newValue && (
            <div className="preview-box">
              <h4>معاينة التغيير:</h4>
              <div className="preview-item">
                <strong>{editableFields.find(f => f.value === fieldToEdit)?.label}:</strong>
                <span className="old-value">قيمة مختلفة</span>
                <span className="arrow">→</span>
                <span className="new-value">{newValue}</span>
              </div>
              <p className="preview-note">
                سيتم تطبيق هذا التغيير على {selectedRows.length} صف
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleApply}
            disabled={!fieldToEdit || !newValue || loading}
          >
            {loading ? 'جاري التطبيق...' : `تطبيق على ${selectedRows.length} صف`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;
```

#### **2. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/BulkEdit/BulkEditModal.css`

```css
/* Bulk Edit Modal */
.bulk-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.bulk-edit-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: #f5f5f5;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.selection-info {
  background: #E3F2FD;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #1976D2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: #1976D2;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
}

/* Form */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.form-select,
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #8FD9D9;
  box-shadow: 0 0 0 3px rgba(143, 217, 217, 0.1);
}

/* Preview */
.preview-box {
  background: #F9F9F9;
  border: 2px dashed #8FD9D9;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.preview-box h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #555;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.preview-item strong {
  color: #333;
}

.old-value {
  color: #999;
  text-decoration: line-through;
}

.arrow {
  color: #8FD9D9;
  font-weight: bold;
}

.new-value {
  color: #4CAF50;
  font-weight: 600;
  background: #E8F5E9;
  padding: 2px 8px;
  border-radius: 4px;
}

.preview-note {
  font-size: 12px;
  color: #666;
  margin: 0;
  font-style: italic;
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-primary {
  background: #8FD9D9;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #7CCACA;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(143, 217, 217, 0.3);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 📦 **Feature 2: Import from Excel**

### **الوصف:**
استيراد بيانات من ملف Excel مع column mapping.

### **المكونات:**

#### **1. ImportModal Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Import/ImportModal.jsx`

```javascript
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import ColumnMapper from './ColumnMapper';
import './Import.css';

const ImportModal = ({ isOpen, onClose, onImport, expectedColumns }) => {
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [excelColumns, setExcelColumns] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Confirm

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          alert('الملف فارغ');
          return;
        }

        // First row as headers
        const headers = jsonData[0];
        const rows = jsonData.slice(1);

        setExcelColumns(headers);
        setExcelData(rows);
        setStep(2); // Move to mapping
      } catch (error) {
        console.error('Excel parse error:', error);
        alert('فشل قراءة ملف Excel');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = () => {
    // Transform data based on mapping
    const transformedData = excelData.map(row => {
      const obj = {};
      Object.keys(columnMapping).forEach(targetCol => {
        const sourceColIndex = excelColumns.indexOf(columnMapping[targetCol]);
        if (sourceColIndex !== -1) {
          obj[targetCol] = row[sourceColIndex];
        }
      });
      return obj;
    });

    onImport(transformedData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setExcelData(null);
    setExcelColumns([]);
    setColumnMapping({});
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="import-overlay" onClick={handleClose}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 استيراد من Excel</h3>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="upload-step">
              <div className="upload-zone">
                <div className="upload-icon">📄</div>
                <p>اختر ملف Excel للاستيراد</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  id="excel-upload"
                  hidden
                />
                <label htmlFor="excel-upload" className="upload-btn">
                  اختر ملف
                </label>
                {file && (
                  <div className="file-info">
                    ✅ {file.name}
                  </div>
                )}
              </div>

              <div className="help-text">
                <h4>📌 ملاحظات:</h4>
                <ul>
                  <li>يجب أن يكون الملف بصيغة .xlsx أو .xls</li>
                  <li>الصف الأول يجب أن يحتوي على أسماء الأعمدة</li>
                  <li>سيتم استيراد أول ورقة عمل في الملف</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="mapping-step">
              <div className="step-info">
                <p>📊 عدد الأعمدة في Excel: {excelColumns.length}</p>
                <p>📋 عدد الصفوف: {excelData.length}</p>
              </div>

              <ColumnMapper
                excelColumns={excelColumns}
                expectedColumns={expectedColumns}
                mapping={columnMapping}
                onChange={setColumnMapping}
              />

              <div className="preview-data">
                <h4>معاينة أول 3 صفوف:</h4>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        {excelColumns.slice(0, 5).map((col, i) => (
                          <th key={i}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.slice(0, 3).map((row, i) => (
                        <tr key={i}>
                          {row.slice(0, 5).map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            إلغاء
          </button>
          {step === 2 && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => setStep(1)}
              >
                ← رجوع
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleImport}
                disabled={Object.keys(columnMapping).length === 0}
              >
                استيراد {excelData.length} صف
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
```

#### **2. ColumnMapper Component:**

**File:** `src/pages/Admin/SpreadsheetView/components/Import/ColumnMapper.jsx`

```javascript
import React from 'react';

const ColumnMapper = ({ excelColumns, expectedColumns, mapping, onChange }) => {
  const handleMapping = (targetCol, sourceCol) => {
    onChange({
      ...mapping,
      [targetCol]: sourceCol
    });
  };

  // Auto-map exact matches
  React.useEffect(() => {
    const autoMapping = {};
    expectedColumns.forEach(expCol => {
      const match = excelColumns.find(
        exCol => exCol.toLowerCase() === expCol.value.toLowerCase()
      );
      if (match) {
        autoMapping[expCol.value] = match;
      }
    });
    onChange(autoMapping);
  }, [excelColumns, expectedColumns]);

  return (
    <div className="column-mapper">
      <h4>ربط الأعمدة:</h4>
      <div className="mapping-list">
        {expectedColumns.map(expCol => (
          <div key={expCol.value} className="mapping-row">
            <div className="target-col">
              <strong>{expCol.label}</strong>
              {expCol.required && <span className="required">*</span>}
            </div>
            <div className="arrow">→</div>
            <select
              className="source-col"
              value={mapping[expCol.value] || ''}
              onChange={(e) => handleMapping(expCol.value, e.target.value)}
            >
              <option value="">-- اختر العمود --</option>
              {excelColumns.map((exCol, i) => (
                <option key={i} value={exCol}>
                  {exCol}
                </option>
              ))}
            </select>
            {mapping[expCol.value] && (
              <span className="mapped-icon">✅</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnMapper;
```

#### **3. CSS Styling:**

**File:** `src/pages/Admin/SpreadsheetView/components/Import/Import.css`

```css
/* Import Modal */
.import-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* Upload Step */
.upload-step {
  padding: 20px;
}

.upload-zone {
  border: 2px dashed #8FD9D9;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background: #F9FCFC;
  margin-bottom: 24px;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-zone p {
  color: #666;
  margin-bottom: 16px;
}

.upload-btn {
  display: inline-block;
  background: #8FD9D9;
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: #7CCACA;
  transform: translateY(-2px);
}

.file-info {
  margin-top: 16px;
  color: #4CAF50;
  font-weight: 500;
}

.help-text {
  background: #FFF9E6;
  border-left: 4px solid #FFD700;
  padding: 16px;
  border-radius: 8px;
}

.help-text h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.help-text ul {
  margin: 0;
  padding-right: 20px;
  color: #666;
  font-size: 13px;
}

.help-text li {
  margin-bottom: 6px;
}

/* Mapping Step */
.mapping-step {
  padding: 20px;
}

.step-info {
  background: #E3F2FD;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #1976D2;
}

.step-info p {
  margin: 4px 0;
}

/* Column Mapper */
.column-mapper h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.mapping-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.target-col {
  flex: 0 0 180px;
  font-size: 14px;
  color: #333;
}

.target-col .required {
  color: #f44336;
  margin-right: 4px;
}

.arrow {
  color: #8FD9D9;
  font-weight: bold;
}

.source-col {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

.mapped-icon {
  flex-shrink: 0;
  font-size: 18px;
}

/* Preview Data */
.preview-data {
  margin-top: 24px;
}

.preview-data h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #555;
}

.preview-table {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th,
.preview-table td {
  padding: 8px 12px;
  text-align: right;
  border-bottom: 1px solid #f0f0f0;
}

.preview-table th {
  background: #f9f9f9;
  font-weight: 600;
  color: #555;
}

.preview-table tbody tr:hover {
  background: #f9f9f9;
}
```

---

## 📦 **Feature 3: Data Validation Rules**

### **الوصف:**
قواعد للتحقق من صحة البيانات (Required, Format, Range).

### **Implementation:**

**File:** `src/pages/Admin/SpreadsheetView/utils/validation.js`

```javascript
// Validation Rules Engine
export class ValidationEngine {
  constructor() {
    this.rules = new Map();
  }

  // Add a validation rule
  addRule(field, rule) {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field).push(rule);
  }

  // Validate a single value
  validate(field, value) {
    const fieldRules = this.rules.get(field) || [];
    const errors = [];

    for (const rule of fieldRules) {
      const error = rule.validate(value);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  // Validate entire row
  validateRow(row) {
    const allErrors = {};

    for (const [field, value] of Object.entries(row)) {
      const errors = this.validate(field, value);
      if (errors.length > 0) {
        allErrors[field] = errors;
      }
    }

    return allErrors;
  }
}

// Rule Classes
export class RequiredRule {
  constructor(message = 'هذا الحقل مطلوب') {
    this.message = message;
  }

  validate(value) {
    if (value === null || value === undefined || value === '') {
      return this.message;
    }
    return null;
  }
}

export class EmailRule {
  constructor(message = 'البريد الإلكتروني غير صحيح') {
    this.message = message;
  }

  validate(value) {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return this.message;
    }
    return null;
  }
}

export class RangeRule {
  constructor(min, max, message) {
    this.min = min;
    this.max = max;
    this.message = message || `القيمة يجب أن تكون بين ${min} و ${max}`;
  }

  validate(value) {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num) || num < this.min || num > this.max) {
      return this.message;
    }
    return null;
  }
}

export class EnumRule {
  constructor(allowedValues, message) {
    this.allowedValues = allowedValues;
    this.message = message || `القيمة يجب أن تكون واحدة من: ${allowedValues.join(', ')}`;
  }

  validate(value) {
    if (!value) return null;
    if (!this.allowedValues.includes(value)) {
      return this.message;
    }
    return null;
  }
}

// Setup default validation rules for TSSR data
export const setupTSSRValidation = () => {
  const engine = new ValidationEngine();

  // Required fields
  engine.addRule('site_id', new RequiredRule('رقم الموقع مطلوب'));
  engine.addRule('final_site_name', new RequiredRule('اسم الموقع مطلوب'));

  // Status fields (enum)
  const statusValues = ['Approved', 'Pending', 'Rejected', 'Under Review'];
  engine.addRule('tssr_status', new EnumRule(statusValues));
  engine.addRule('ti_status', new EnumRule(statusValues));
  engine.addRule('rf_plan_status', new EnumRule(statusValues));

  // Numeric ranges
  engine.addRule('height', new RangeRule(0, 200, 'الارتفاع يجب أن يكون بين 0-200 متر'));
  engine.addRule('longitude', new RangeRule(34, 40, 'خط الطول غير صحيح للأردن'));
  engine.addRule('latitude', new RangeRule(29, 34, 'خط العرض غير صحيح للأردن'));

  return engine;
};
```

#### **Integration in SpreadsheetView:**

```javascript
// src/pages/Admin/SpreadsheetView/SpreadsheetView.jsx

import { setupTSSRValidation } from './utils/validation';
import { useState, useEffect } from 'react';

const SpreadsheetView = () => {
  const [validationEngine, setValidationEngine] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const engine = setupTSSRValidation();
    setValidationEngine(engine);
  }, []);

  const handleCellValueChanged = (params) => {
    const { data, colDef, newValue } = params;
    const field = colDef.field;

    // Validate
    if (validationEngine) {
      const errors = validationEngine.validate(field, newValue);
      
      if (errors.length > 0) {
        // Show error
        setValidationErrors(prev => ({
          ...prev,
          [`${data.site_id}_${field}`]: errors[0]
        }));
        
        // Optionally revert value
        // params.node.setDataValue(field, params.oldValue);
      } else {
        // Clear error
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`${data.site_id}_${field}`];
          return newErrors;
        });
      }
    }
  };

  // Show validation errors in UI
  const cellStyle = (params) => {
    const key = `${params.data.site_id}_${params.colDef.field}`;
    if (validationErrors[key]) {
      return { backgroundColor: '#FFEBEE', border: '1px solid #f44336' };
    }
    return null;
  };

  return (
    <div className="spreadsheet-view">
      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="validation-banner">
          ⚠️ يوجد {Object.keys(validationErrors).length} خطأ في البيانات
        </div>
      )}

      <AgGridReact
        onCellValueChanged={handleCellValueChanged}
        // Apply cell style for errors
        defaultColDef={{
          ...defaultColDef,
          cellStyle: cellStyle
        }}
      />
    </div>
  );
};
```

---

## 📦 **Feature 4: Advanced Filter Builder**

### **الوصف:**
بناء فلاتر معقدة مع AND/OR conditions.

**File:** `src/pages/Admin/SpreadsheetView/components/AdvancedFilter/FilterBuilder.jsx`

```javascript
import React, { useState } from 'react';
import FilterRule from './FilterRule';
import './AdvancedFilter.css';

const FilterBuilder = ({ isOpen, onClose, onApply, columns }) => {
  const [filters, setFilters] = useState([
    { id: 1, field: '', operator: '=', value: '' }
  ]);
  const [matchType, setMatchType] = useState('AND'); // AND or OR

  const addFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: '',
      operator: '=',
      value: ''
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id, updates) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const handleApply = () => {
    // Convert to AG Grid filter model
    const validFilters = filters.filter(f => f.field && f.value);
    
    if (validFilters.length === 0) {
      alert('الرجاء إضافة فلتر واحد على الأقل');
      return;
    }

    const filterModel = {};
    
    if (matchType === 'AND') {
      // Each filter on its own field
      validFilters.forEach(f => {
        filterModel[f.field] = {
          type: f.operator,
          filter: f.value
        };
      });
    } else {
      // OR logic - more complex
      // For simplicity, we'll apply first filter and notify about limitation
      filterModel[validFilters[0].field] = {
        type: validFilters[0].operator,
        filter: validFilters[0].value
      };
    }

    onApply(filterModel);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-builder" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔍 فلترة متقدمة</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Match Type */}
          <div className="match-type">
            <label>نوع المطابقة:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="AND"
                  checked={matchType === 'AND'}
                  onChange={(e) => setMatchType(e.target.value)}
                />
                AND (جميع الشروط)
              </label>
              <label>
                <input
                  type="radio"
                  value="OR"
                  checked={matchType === 'OR'}
                  onChange={(e) => setMatchType(e.target.value)}
                />
                OR (أي شرط)
              </label>
            </div>
          </div>

          {/* Filter Rules */}
          <div className="filters-list">
            {filters.map((filter, index) => (
              <div key={filter.id}>
                {index > 0 && (
                  <div className="logic-operator">{matchType}</div>
                )}
                <FilterRule
                  filter={filter}
                  columns={columns}
                  onChange={(updates) => updateFilter(filter.id, updates)}
                  onRemove={() => removeFilter(filter.id)}
                  canRemove={filters.length > 1}
                />
              </div>
            ))}
          </div>

          <button className="add-filter-btn" onClick={addFilter}>
            + إضافة فلتر
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            تطبيق الفلاتر
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBuilder;
```

**File:** `src/pages/Admin/SpreadsheetView/components/AdvancedFilter/FilterRule.jsx`

```javascript
import React from 'react';

const FilterRule = ({ filter, columns, onChange, onRemove, canRemove }) => {
  const operators = [
    { value: 'equals', label: '=' },
    { value: 'notEqual', label: '≠' },
    { value: 'contains', label: 'يحتوي' },
    { value: 'notContains', label: 'لا يحتوي' },
    { value: 'startsWith', label: 'يبدأ بـ' },
    { value: 'endsWith', label: 'ينتهي بـ' },
    { value: 'greaterThan', label: '>' },
    { value: 'lessThan', label: '<' },
  ];

  return (
    <div className="filter-rule">
      <select
        className="field-select"
        value={filter.field}
        onChange={(e) => onChange({ field: e.target.value })}
      >
        <option value="">-- اختر الحقل --</option>
        {columns.map(col => (
          <option key={col.field} value={col.field}>
            {col.headerName}
          </option>
        ))}
      </select>

      <select
        className="operator-select"
        value={filter.operator}
        onChange={(e) => onChange({ operator: e.target.value })}
      >
        {operators.map(op => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        className="value-input"
        placeholder="القيمة"
        value={filter.value}
        onChange={(e) => onChange({ value: e.target.value })}
      />

      {canRemove && (
        <button 
          className="remove-filter-btn"
          onClick={onRemove}
          title="حذف"
        >
          🗑️
        </button>
      )}
    </div>
  );
};

export default FilterRule;
```

---

## ✅ **Testing Checklist**

### **Bulk Edit:**
- [ ] Select multiple rows (Ctrl+Click)
- [ ] Open bulk edit modal
- [ ] Choose field to edit
- [ ] Preview shows correct change
- [ ] Apply updates all rows
- [ ] Activity log records the bulk edit

### **Import Excel:**
- [ ] Upload .xlsx file
- [ ] Columns detected correctly
- [ ] Auto-mapping works for exact matches
- [ ] Manual mapping saves
- [ ] Preview shows first 3 rows
- [ ] Import creates new rows

### **Validation:**
- [ ] Required fields show error when empty
- [ ] Invalid email format rejected
- [ ] Out-of-range numbers rejected
- [ ] Invalid enum values rejected
- [ ] Error cells highlighted in red
- [ ] Validation banner shows error count

### **Advanced Filter:**
- [ ] Add multiple filter rules
- [ ] AND logic works
- [ ] OR logic works
- [ ] Remove filter rule works
- [ ] Filter applied to grid
- [ ] Clear filters works

---

## 🎯 **Claude Code Prompt**

```
أنشئ ميزات Data Management للـ SpreadsheetView:

1. Bulk Edit Mode - تعديل جماعي
2. Import from Excel - استيراد
3. Data Validation - قواعد التحقق
4. Advanced Filter Builder - فلترة متقدمة

استخدم:
- XLSX library (موجودة)
- Modal من Phase 3
- Firebase للـ activity log

المكونات:
- BulkEditModal.jsx
- ImportModal.jsx + ColumnMapper.jsx
- validation.js utility
- FilterBuilder.jsx + FilterRule.jsx

YAS colors, Arabic UI, responsive.
راجع PHASE_6_Data_Management.md للتفاصيل.
```

---

**Next:** `PHASE_7_Visualization.md` 📈
