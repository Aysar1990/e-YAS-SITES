/**
 * MacroPlayer - Playback engine for recorded macros
 * Phase 8: Power Features
 *
 * Handles playback of recorded action sequences with speed control
 */

// Default delay between actions (ms)
const BASE_DELAY = 100

/**
 * MacroPlayer class
 */
export class MacroPlayer {
  constructor() {
    this.isPlaying = false
    this.isPaused = false
    this.currentIndex = 0
    this.actions = []
    this.options = {}
  }

  /**
   * Play a sequence of actions
   * @param {Array} actions - Array of action objects
   * @param {Object} options - Playback options
   * @param {number} options.speed - Speed multiplier (0.5, 1, 2, 5)
   * @param {Function} options.onAction - Callback for each action
   * @param {Function} options.onComplete - Callback when playback ends
   * @param {Function} options.onError - Callback on error
   */
  async play(actions, options = {}) {
    if (this.isPlaying) {
      throw new Error('Playback already in progress')
    }

    this.actions = actions
    this.options = {
      speed: 1,
      onAction: null,
      onComplete: null,
      onError: null,
      ...options
    }

    this.isPlaying = true
    this.isPaused = false
    this.currentIndex = 0

    const delay = BASE_DELAY / this.options.speed

    try {
      for (let i = 0; i < this.actions.length; i++) {
        // Check if stopped
        if (!this.isPlaying) {
          console.log('[MacroPlayer] Playback stopped')
          break
        }

        // Wait while paused
        while (this.isPaused) {
          await this.sleep(100)
        }

        this.currentIndex = i
        const action = this.actions[i]

        // Execute action
        await this.executeAction(action)

        // Callback
        if (this.options.onAction) {
          this.options.onAction(action, i)
        }

        // Delay before next action (except for last)
        if (i < this.actions.length - 1) {
          await this.sleep(delay)
        }
      }

      console.log('[MacroPlayer] Playback complete')

      if (this.options.onComplete) {
        this.options.onComplete()
      }

    } catch (error) {
      console.error('[MacroPlayer] Playback error:', error)

      if (this.options.onError) {
        this.options.onError(error)
      }

      throw error

    } finally {
      this.isPlaying = false
      this.isPaused = false
      this.currentIndex = 0
    }
  }

  /**
   * Execute a single action
   */
  async executeAction(action) {
    console.log('[MacroPlayer] Executing action:', action.type, action)

    switch (action.type) {
      case 'cell_edit':
        return this.executeCellEdit(action)
      case 'filter':
        return this.executeFilter(action)
      case 'sort':
        return this.executeSort(action)
      case 'select':
        return this.executeSelect(action)
      case 'navigation':
        return this.executeNavigation(action)
      case 'delete':
        return this.executeDelete(action)
      default:
        console.warn('[MacroPlayer] Unknown action type:', action.type)
    }
  }

  /**
   * Execute cell edit action
   */
  async executeCellEdit(action) {
    // Dispatch custom event for grid to handle
    const event = new CustomEvent('macro:cell_edit', {
      detail: {
        cell: action.cell,
        field: action.field,
        rowId: action.rowId,
        value: action.value,
        oldValue: action.oldValue
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Execute filter action
   */
  async executeFilter(action) {
    const event = new CustomEvent('macro:filter', {
      detail: {
        field: action.field,
        filterType: action.filterType,
        filterValue: action.filterValue
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Execute sort action
   */
  async executeSort(action) {
    const event = new CustomEvent('macro:sort', {
      detail: {
        field: action.field,
        direction: action.direction
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Execute select action
   */
  async executeSelect(action) {
    const event = new CustomEvent('macro:select', {
      detail: {
        rowIds: action.rowIds,
        mode: action.mode // 'single', 'add', 'range'
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Execute navigation action
   */
  async executeNavigation(action) {
    const event = new CustomEvent('macro:navigation', {
      detail: {
        target: action.target, // 'first', 'last', 'next', 'prev', 'cell'
        cell: action.cell
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Execute delete action
   */
  async executeDelete(action) {
    const event = new CustomEvent('macro:delete', {
      detail: {
        rowIds: action.rowIds
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.isPlaying) {
      this.isPaused = true
      console.log('[MacroPlayer] Playback paused')
    }
  }

  /**
   * Resume playback
   */
  resume() {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false
      console.log('[MacroPlayer] Playback resumed')
    }
  }

  /**
   * Stop playback
   */
  stop() {
    this.isPlaying = false
    this.isPaused = false
    console.log('[MacroPlayer] Playback stopped')
  }

  /**
   * Get current playback status
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      totalActions: this.actions.length,
      progress: this.actions.length > 0
        ? (this.currentIndex / this.actions.length) * 100
        : 0
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Action creators for recording
export const createAction = {
  cellEdit: (field, rowId, value, oldValue) => ({
    type: 'cell_edit',
    field,
    rowId,
    cell: `${field}:${rowId}`,
    value,
    oldValue
  }),

  filter: (field, filterType, filterValue) => ({
    type: 'filter',
    field,
    filterType,
    filterValue
  }),

  sort: (field, direction) => ({
    type: 'sort',
    field,
    direction
  }),

  select: (rowIds, mode = 'single') => ({
    type: 'select',
    rowIds: Array.isArray(rowIds) ? rowIds : [rowIds],
    mode
  }),

  navigation: (target, cell = null) => ({
    type: 'navigation',
    target,
    cell
  }),

  delete: (rowIds) => ({
    type: 'delete',
    rowIds: Array.isArray(rowIds) ? rowIds : [rowIds]
  })
}

export default MacroPlayer
