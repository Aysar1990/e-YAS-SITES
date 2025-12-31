/**
 * useShortcuts - Custom hook for keyboard shortcuts
 * Phase 8: Power Features
 *
 * Uses react-hotkeys-hook for keybindings
 */

import { useCallback, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

/**
 * Keyboard shortcuts hook
 * @param {Object} options - Configuration options
 * @param {Function} options.onSave - Save handler (Ctrl+S)
 * @param {Function} options.onSearch - Search handler (Ctrl+F)
 * @param {Function} options.onExport - Export handler (Ctrl+E)
 * @param {Function} options.onUndo - Undo handler (Ctrl+Z)
 * @param {Function} options.onRedo - Redo handler (Ctrl+Y)
 * @param {Function} options.onSelectAll - Select all handler (Ctrl+A)
 * @param {Function} options.onDelete - Delete handler (Delete)
 * @param {Function} options.onClearSelection - Clear selection (Escape)
 * @param {Function} options.onRefresh - Refresh handler (F5)
 * @param {Function} options.onShowHelp - Show help handler (?)
 * @param {Object} options.gridRef - AG Grid reference
 */
export const useShortcuts = ({
  onSave,
  onSearch,
  onExport,
  onUndo,
  onRedo,
  onSelectAll,
  onDelete,
  onClearSelection,
  onRefresh,
  onShowHelp,
  gridRef
}) => {
  // Track undo/redo history
  const historyRef = useRef({
    undoStack: [],
    redoStack: []
  })

  // Ctrl+S - Save data
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault()
    console.log('[Shortcuts] Save triggered')
    if (onSave) onSave()
  }, { enableOnFormTags: false })

  // Ctrl+F - Focus search
  useHotkeys('ctrl+f', (e) => {
    e.preventDefault()
    console.log('[Shortcuts] Search triggered')
    if (onSearch) {
      onSearch()
    } else {
      // Default: focus search input
      const searchInput = document.querySelector('.smart-search input, .quick-filter input')
      if (searchInput) searchInput.focus()
    }
  }, { enableOnFormTags: false })

  // Ctrl+E - Open export dialog
  useHotkeys('ctrl+e', (e) => {
    e.preventDefault()
    console.log('[Shortcuts] Export triggered')
    if (onExport) onExport()
  }, { enableOnFormTags: false })

  // Ctrl+Z - Undo
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault()
    console.log('[Shortcuts] Undo triggered')
    if (onUndo) {
      onUndo()
    } else {
      // Default undo from history
      const { undoStack, redoStack } = historyRef.current
      if (undoStack.length > 0) {
        const action = undoStack.pop()
        redoStack.push(action)
        console.log('[Shortcuts] Undo action:', action)
      }
    }
  }, { enableOnFormTags: false })

  // Ctrl+Y - Redo
  useHotkeys('ctrl+y', (e) => {
    e.preventDefault()
    console.log('[Shortcuts] Redo triggered')
    if (onRedo) {
      onRedo()
    } else {
      // Default redo from history
      const { undoStack, redoStack } = historyRef.current
      if (redoStack.length > 0) {
        const action = redoStack.pop()
        undoStack.push(action)
        console.log('[Shortcuts] Redo action:', action)
      }
    }
  }, { enableOnFormTags: false })

  // Ctrl+A - Select all rows
  useHotkeys('ctrl+a', (e) => {
    e.preventDefault()
    console.log('[Shortcuts] Select all triggered')
    if (onSelectAll) {
      onSelectAll()
    } else if (gridRef?.current?.api) {
      gridRef.current.api.selectAll()
    }
  }, { enableOnFormTags: false })

  // Delete - Delete selected
  useHotkeys('delete', (e) => {
    // Don't trigger if in input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    console.log('[Shortcuts] Delete triggered')
    if (onDelete) onDelete()
  }, { enableOnFormTags: false })

  // Escape - Clear selection
  useHotkeys('escape', (e) => {
    console.log('[Shortcuts] Clear selection triggered')
    if (onClearSelection) {
      onClearSelection()
    } else if (gridRef?.current?.api) {
      gridRef.current.api.deselectAll()
    }
  }, { enableOnFormTags: true })

  // F5 - Refresh data
  useHotkeys('f5', (e) => {
    e.preventDefault()
    console.log('[Shortcuts] Refresh triggered')
    if (onRefresh) onRefresh()
  }, { enableOnFormTags: false })

  // ? - Show help panel
  useHotkeys('shift+/', (e) => {
    // shift+/ = ?
    e.preventDefault()
    console.log('[Shortcuts] Help triggered')
    if (onShowHelp) onShowHelp()
  }, { enableOnFormTags: false })

  // Push action to undo stack
  const pushToUndoStack = useCallback((action) => {
    historyRef.current.undoStack.push(action)
    historyRef.current.redoStack = [] // Clear redo on new action
  }, [])

  // Get undo/redo status
  const getHistoryStatus = useCallback(() => ({
    canUndo: historyRef.current.undoStack.length > 0,
    canRedo: historyRef.current.redoStack.length > 0,
    undoCount: historyRef.current.undoStack.length,
    redoCount: historyRef.current.redoStack.length
  }), [])

  return {
    pushToUndoStack,
    getHistoryStatus,
    historyRef
  }
}

export default useShortcuts
