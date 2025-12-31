/**
 * MacroRecorder - Record and manage automation macros
 * Phase 8: Power Features
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import MacroLibrary from './MacroLibrary'
import { MacroPlayer } from './macroPlayer'
import './Macros.css'

const MacroRecorder = ({ onClose, onPlayAction }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [macroName, setMacroName] = useState('')
  const [actions, setActions] = useState([])
  const [savedMacros, setSavedMacros] = useState([])
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showLibrary, setShowLibrary] = useState(true)

  const playerRef = useRef(new MacroPlayer())

  // Load saved macros on mount
  useEffect(() => {
    loadSavedMacros()
  }, [])

  // Load macros from localStorage
  const loadSavedMacros = () => {
    const macros = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('macro_')) {
        try {
          const macro = JSON.parse(localStorage.getItem(key))
          macros.push(macro)
        } catch (e) {
          console.error('[Macros] Failed to parse macro:', key)
        }
      }
    }
    setSavedMacros(macros.sort((a, b) => b.createdAt - a.createdAt))
  }

  // Start recording
  const startRecording = useCallback(() => {
    setIsRecording(true)
    setActions([])
    setMacroName(`Macro_${Date.now()}`)
    setShowLibrary(false)
    console.log('[Macros] Recording started')
  }, [])

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false)
    console.log('[Macros] Recording stopped, actions:', actions.length)
  }, [actions])

  // Record an action
  const recordAction = useCallback((action) => {
    if (!isRecording) return

    const newAction = {
      ...action,
      timestamp: Date.now(),
      id: `action_${Date.now()}`
    }

    setActions(prev => [...prev, newAction])
    console.log('[Macros] Action recorded:', action.type)
  }, [isRecording])

  // Save macro
  const saveMacro = useCallback(() => {
    if (!macroName.trim() || actions.length === 0) return

    const macro = {
      id: `macro_${Date.now()}`,
      name: macroName.trim(),
      actions,
      createdAt: Date.now(),
      lastRun: null,
      runCount: 0
    }

    localStorage.setItem(`macro_${macro.id}`, JSON.stringify(macro))
    loadSavedMacros()
    setActions([])
    setMacroName('')
    setShowLibrary(true)
    console.log('[Macros] Macro saved:', macro.name)
  }, [macroName, actions])

  // Play macro
  const playMacro = useCallback(async (macro) => {
    if (isPlaying) return

    setIsPlaying(true)
    console.log('[Macros] Playing macro:', macro.name)

    try {
      await playerRef.current.play(macro.actions, {
        speed: playbackSpeed,
        onAction: (action, index) => {
          console.log(`[Macros] Playing action ${index + 1}/${macro.actions.length}:`, action.type)
          if (onPlayAction) onPlayAction(action)
        }
      })

      // Update last run
      macro.lastRun = Date.now()
      macro.runCount = (macro.runCount || 0) + 1
      localStorage.setItem(`macro_${macro.id}`, JSON.stringify(macro))
      loadSavedMacros()

    } catch (error) {
      console.error('[Macros] Playback error:', error)
    } finally {
      setIsPlaying(false)
    }
  }, [isPlaying, playbackSpeed, onPlayAction])

  // Delete macro
  const deleteMacro = useCallback((macroId) => {
    localStorage.removeItem(`macro_${macroId}`)
    loadSavedMacros()
    console.log('[Macros] Macro deleted:', macroId)
  }, [])

  // Get action icon
  const getActionIcon = (type) => {
    const icons = {
      cell_edit: '✏️',
      filter: '🔍',
      sort: '↕️',
      select: '☑️',
      navigation: '🧭',
      export: '📥',
      delete: '🗑️'
    }
    return icons[type] || '⚡'
  }

  // Expose recordAction to parent
  useEffect(() => {
    window.__macroRecordAction = recordAction
    return () => {
      delete window.__macroRecordAction
    }
  }, [recordAction])

  return (
    <div className="macro-panel-overlay" onClick={onClose}>
      <div className="macro-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="macro-header">
          <h2>⏺️ الماكرو والأتمتة</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="macro-content">
          {/* Recording Controls */}
          <div className="macro-controls">
            {!isRecording ? (
              <button className="btn-record" onClick={startRecording}>
                <span className="record-icon">⏺️</span>
                بدء التسجيل
              </button>
            ) : (
              <button className="btn-stop" onClick={stopRecording}>
                <span className="stop-icon">⏹️</span>
                إيقاف التسجيل
              </button>
            )}

            {/* Speed Control */}
            <div className="speed-control">
              <label>السرعة:</label>
              <select
                value={playbackSpeed}
                onChange={e => setPlaybackSpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
              </select>
            </div>
          </div>

          {/* Recording in Progress */}
          {isRecording && (
            <div className="recording-section">
              <div className="recording-indicator">
                <span className="pulse-dot"></span>
                جاري التسجيل...
              </div>

              <div className="macro-name-input">
                <input
                  type="text"
                  value={macroName}
                  onChange={e => setMacroName(e.target.value)}
                  placeholder="اسم الماكرو"
                />
              </div>

              {/* Actions List */}
              <div className="actions-list">
                <h4>الإجراءات المسجلة ({actions.length})</h4>
                {actions.length === 0 ? (
                  <p className="no-actions">قم بإجراء عمليات في الجدول لتسجيلها</p>
                ) : (
                  <ul>
                    {actions.map((action, idx) => (
                      <li key={action.id} className="action-item">
                        <span className="action-index">{idx + 1}</span>
                        <span className="action-icon">{getActionIcon(action.type)}</span>
                        <span className="action-type">{action.type}</span>
                        {action.cell && <span className="action-detail">{action.cell}</span>}
                        {action.value && <span className="action-value">→ {action.value}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Save Button */}
              {actions.length > 0 && !isRecording && (
                <button className="btn-save" onClick={saveMacro}>
                  💾 حفظ الماكرو
                </button>
              )}
            </div>
          )}

          {/* Saved Actions after stop */}
          {!isRecording && actions.length > 0 && (
            <div className="save-section">
              <div className="macro-name-input">
                <input
                  type="text"
                  value={macroName}
                  onChange={e => setMacroName(e.target.value)}
                  placeholder="اسم الماكرو"
                />
              </div>
              <div className="actions-summary">
                {actions.length} إجراء مسجل
              </div>
              <button className="btn-save" onClick={saveMacro}>
                💾 حفظ الماكرو
              </button>
            </div>
          )}

          {/* Macro Library */}
          {showLibrary && !isRecording && actions.length === 0 && (
            <MacroLibrary
              macros={savedMacros}
              onPlay={playMacro}
              onDelete={deleteMacro}
              isPlaying={isPlaying}
            />
          )}

          {/* Playback Status */}
          {isPlaying && (
            <div className="playback-status">
              <div className="playback-indicator">
                <span className="play-icon">▶️</span>
                جاري التشغيل...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MacroRecorder
