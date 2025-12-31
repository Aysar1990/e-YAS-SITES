/**
 * MacroLibrary - List of saved macros
 * Phase 8: Power Features
 */

import React from 'react'

const MacroLibrary = ({ macros = [], onPlay, onDelete, isPlaying }) => {
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'لم يتم تشغيله'

    const date = new Date(timestamp)
    return date.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return ''

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'الآن'
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    return `منذ ${days} يوم`
  }

  if (macros.length === 0) {
    return (
      <div className="macro-library-empty">
        <div className="empty-icon">📁</div>
        <h3>لا توجد ماكرو محفوظة</h3>
        <p>ابدأ بتسجيل ماكرو جديد لأتمتة العمليات المتكررة</p>
      </div>
    )
  }

  return (
    <div className="macro-library">
      <h3>الماكرو المحفوظة ({macros.length})</h3>

      <div className="macro-list">
        {macros.map((macro) => (
          <div key={macro.id} className="macro-card">
            <div className="macro-info">
              <div className="macro-name">{macro.name}</div>
              <div className="macro-meta">
                <span className="action-count">
                  {macro.actions?.length || 0} إجراء
                </span>
                <span className="separator">•</span>
                <span className="last-run">
                  {macro.lastRun ? formatRelativeTime(macro.lastRun) : 'لم يتم تشغيله'}
                </span>
                {macro.runCount > 0 && (
                  <>
                    <span className="separator">•</span>
                    <span className="run-count">{macro.runCount} مرة</span>
                  </>
                )}
              </div>
              <div className="macro-created">
                أُنشئ: {formatTime(macro.createdAt)}
              </div>
            </div>

            <div className="macro-actions">
              <button
                className="btn-play"
                onClick={() => onPlay(macro)}
                disabled={isPlaying}
                title="تشغيل"
              >
                {isPlaying ? '⏳' : '▶️'}
              </button>
              <button
                className="btn-delete"
                onClick={() => {
                  if (window.confirm(`هل تريد حذف "${macro.name}"؟`)) {
                    onDelete(macro.id)
                  }
                }}
                title="حذف"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MacroLibrary
