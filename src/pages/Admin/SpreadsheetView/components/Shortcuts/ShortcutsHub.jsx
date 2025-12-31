/**
 * ShortcutsHub - Keyboard shortcuts help panel
 * Phase 8: Power Features
 */

import React from 'react'
import './ShortcutsHub.css'

// Shortcut definitions
const SHORTCUTS = [
  {
    category: 'عام',
    items: [
      { keys: ['Ctrl', 'S'], action: 'حفظ البيانات', description: 'حفظ التغييرات' },
      { keys: ['Ctrl', 'F'], action: 'بحث', description: 'التركيز على البحث' },
      { keys: ['Ctrl', 'E'], action: 'تصدير', description: 'فتح نافذة التصدير' },
      { keys: ['F5'], action: 'تحديث', description: 'تحديث البيانات' },
      { keys: ['?'], action: 'مساعدة', description: 'عرض الاختصارات' }
    ]
  },
  {
    category: 'تحرير',
    items: [
      { keys: ['Ctrl', 'Z'], action: 'تراجع', description: 'التراجع عن آخر تعديل' },
      { keys: ['Ctrl', 'Y'], action: 'إعادة', description: 'إعادة التعديل الملغي' },
      { keys: ['Ctrl', 'A'], action: 'تحديد الكل', description: 'تحديد جميع الصفوف' },
      { keys: ['Delete'], action: 'حذف', description: 'حذف المحدد' },
      { keys: ['Escape'], action: 'إلغاء', description: 'إلغاء التحديد' }
    ]
  },
  {
    category: 'التنقل',
    items: [
      { keys: ['↑', '↓'], action: 'تنقل', description: 'التنقل بين الصفوف' },
      { keys: ['Enter'], action: 'تحرير', description: 'تحرير الخلية' },
      { keys: ['Tab'], action: 'التالي', description: 'الخلية التالية' },
      { keys: ['Ctrl', 'Home'], action: 'البداية', description: 'أول خلية' },
      { keys: ['Ctrl', 'End'], action: 'النهاية', description: 'آخر خلية' }
    ]
  }
]

const ShortcutsHub = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="shortcuts-header">
          <h2>⌨️ اختصارات لوحة المفاتيح</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Shortcuts List */}
        <div className="shortcuts-content">
          {SHORTCUTS.map((category, catIndex) => (
            <div key={catIndex} className="shortcut-category">
              <h3>{category.category}</h3>
              <div className="shortcut-list">
                {category.items.map((shortcut, idx) => (
                  <div key={idx} className="shortcut-item">
                    <div className="shortcut-keys">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd className="kbd">{key}</kbd>
                          {keyIdx < shortcut.keys.length - 1 && <span className="plus">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="shortcut-info">
                      <span className="shortcut-action">{shortcut.action}</span>
                      <span className="shortcut-desc">{shortcut.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shortcuts-footer">
          <p>اضغط <kbd className="kbd">?</kbd> لإظهار/إخفاء هذه النافذة</p>
        </div>
      </div>
    </div>
  )
}

export default ShortcutsHub
