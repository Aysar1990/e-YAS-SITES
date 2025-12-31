/**
 * PrintSettings - Print configuration panel
 * Phase 9: Mobile & Print
 */

import React from 'react'

const PrintSettings = ({ settings, onUpdateSetting, onToggleColumn }) => {
  return (
    <div className="print-settings">
      <h3>⚙️ إعدادات الطباعة</h3>

      {/* Orientation */}
      <div className="setting-group">
        <label>الاتجاه</label>
        <div className="orientation-buttons">
          <button
            className={settings.orientation === 'landscape' ? 'active' : ''}
            onClick={() => onUpdateSetting('orientation', 'landscape')}
          >
            <span className="icon">▭</span>
            <span>أفقي</span>
          </button>
          <button
            className={settings.orientation === 'portrait' ? 'active' : ''}
            onClick={() => onUpdateSetting('orientation', 'portrait')}
          >
            <span className="icon">▯</span>
            <span>عمودي</span>
          </button>
        </div>
      </div>

      {/* Paper Size */}
      <div className="setting-group">
        <label>حجم الورق</label>
        <select
          value={settings.paperSize}
          onChange={(e) => onUpdateSetting('paperSize', e.target.value)}
        >
          <option value="a4">A4</option>
          <option value="a3">A3</option>
          <option value="letter">Letter</option>
        </select>
      </div>

      {/* Rows Per Page */}
      <div className="setting-group">
        <label>الصفوف لكل صفحة</label>
        <select
          value={settings.rowsPerPage}
          onChange={(e) => onUpdateSetting('rowsPerPage', parseInt(e.target.value))}
        >
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={40}>40</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* Include Options */}
      <div className="setting-group">
        <label>تضمين</label>
        <div className="checkboxes">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.includeHeader}
              onChange={(e) => onUpdateSetting('includeHeader', e.target.checked)}
            />
            <span>رأس الصفحة</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.includeFooter}
              onChange={(e) => onUpdateSetting('includeFooter', e.target.checked)}
            />
            <span>تذييل الصفحة</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.includeStats}
              onChange={(e) => onUpdateSetting('includeStats', e.target.checked)}
            />
            <span>الإحصائيات</span>
          </label>
        </div>
      </div>

      {/* Column Selection */}
      <div className="setting-group columns">
        <label>الأعمدة</label>
        <div className="column-list">
          {settings.columns.map((col) => (
            <label key={col.key} className="checkbox-label column-item">
              <input
                type="checkbox"
                checked={col.enabled}
                onChange={() => onToggleColumn(col.key)}
              />
              <span>{col.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PrintSettings
