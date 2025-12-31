/**
 * ThemeSwitcher Component
 * مكون لتبديل الثيمات مع دعم التخصيص
 */

import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import './ThemeSwitcher.css'

const ThemeSwitcher = ({ onClose, compact = false }) => {
  const {
    currentTheme,
    themes,
    customColors,
    setTheme,
    updateCustomColor,
    resetCustomColors
  } = useTheme()

  const [showCustomizer, setShowCustomizer] = useState(false)

  // الألوان الرئيسية للتخصيص
  const customizableColors = [
    { key: 'primary', label: 'اللون الرئيسي', labelEn: 'Primary' },
    { key: 'accent', label: 'اللون الثانوي', labelEn: 'Accent' },
    { key: 'background', label: 'الخلفية', labelEn: 'Background' },
    { key: 'surface', label: 'السطح', labelEn: 'Surface' },
    { key: 'text', label: 'النص', labelEn: 'Text' },
    { key: 'success', label: 'نجاح', labelEn: 'Success' },
    { key: 'warning', label: 'تحذير', labelEn: 'Warning' },
    { key: 'error', label: 'خطأ', labelEn: 'Error' }
  ]

  // عرض مصغر للثيم
  if (compact) {
    return (
      <div className="theme-switcher-compact">
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            className={`theme-btn-compact ${currentTheme === key ? 'active' : ''}`}
            onClick={() => setTheme(key)}
            title={theme.nameAr}
            style={{
              '--preview-bg': theme.colors.background,
              '--preview-primary': theme.colors.primary
            }}
          >
            <span className="theme-icon">{theme.icon}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="theme-switcher-panel">
      <div className="theme-panel-header">
        <h3>🎨 الثيمات</h3>
        {onClose && (
          <button className="btn-close-theme" onClick={onClose}>✕</button>
        )}
      </div>

      {/* قائمة الثيمات */}
      <div className="themes-grid">
        {Object.entries(themes).map(([key, theme]) => (
          <div
            key={key}
            className={`theme-option ${currentTheme === key ? 'active' : ''}`}
            onClick={() => setTheme(key)}
          >
            <div
              className="theme-preview"
              style={{
                background: theme.colors.background,
                borderColor: theme.colors.primary
              }}
            >
              <div
                className="preview-header"
                style={{ background: theme.colors.surface }}
              >
                <div
                  className="preview-dot"
                  style={{ background: theme.colors.primary }}
                />
                <div
                  className="preview-dot"
                  style={{ background: theme.colors.accent }}
                />
              </div>
              <div className="preview-content">
                <div
                  className="preview-line"
                  style={{ background: theme.colors.text, opacity: 0.8 }}
                />
                <div
                  className="preview-line short"
                  style={{ background: theme.colors.textSecondary, opacity: 0.5 }}
                />
              </div>
            </div>
            <div className="theme-info">
              <span className="theme-icon">{theme.icon}</span>
              <span className="theme-name">{theme.nameAr}</span>
            </div>
            {currentTheme === key && (
              <div className="theme-active-badge">✓</div>
            )}
          </div>
        ))}
      </div>

      {/* قسم التخصيص للثيم المخصص */}
      {currentTheme === 'custom' && (
        <div className="custom-theme-section">
          <div className="custom-header">
            <button
              className="btn-toggle-customizer"
              onClick={() => setShowCustomizer(!showCustomizer)}
            >
              {showCustomizer ? '▼ إخفاء التخصيص' : '▶ تخصيص الألوان'}
            </button>
            <button
              className="btn-reset-colors"
              onClick={resetCustomColors}
              title="إعادة تعيين للافتراضي"
            >
              ↺ إعادة تعيين
            </button>
          </div>

          {showCustomizer && (
            <div className="color-customizer">
              {customizableColors.map(({ key, label }) => (
                <div key={key} className="color-row">
                  <label>{label}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={customColors[key] || '#000000'}
                      onChange={(e) => updateCustomColor(key, e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={customColors[key] || ''}
                      onChange={(e) => updateCustomColor(key, e.target.value)}
                      className="color-text"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* معاينة الألوان الحالية */}
      <div className="current-colors-preview">
        <h4>الألوان الحالية</h4>
        <div className="colors-row">
          <div
            className="color-swatch"
            style={{ background: themes[currentTheme]?.colors?.primary || customColors.primary }}
            title="Primary"
          />
          <div
            className="color-swatch"
            style={{ background: themes[currentTheme]?.colors?.accent || customColors.accent }}
            title="Accent"
          />
          <div
            className="color-swatch"
            style={{ background: themes[currentTheme]?.colors?.background || customColors.background }}
            title="Background"
          />
          <div
            className="color-swatch"
            style={{ background: themes[currentTheme]?.colors?.surface || customColors.surface }}
            title="Surface"
          />
          <div
            className="color-swatch"
            style={{ background: themes[currentTheme]?.colors?.success || customColors.success }}
            title="Success"
          />
          <div
            className="color-swatch"
            style={{ background: themes[currentTheme]?.colors?.warning || customColors.warning }}
            title="Warning"
          />
          <div
            className="color-swatch"
            style={{ background: themes[currentTheme]?.colors?.error || customColors.error }}
            title="Error"
          />
        </div>
      </div>
    </div>
  )
}

export default ThemeSwitcher
