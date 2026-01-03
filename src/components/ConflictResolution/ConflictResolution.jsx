/**
 * ConflictResolution Component
 * UI for viewing and resolving sync conflicts between local and server data
 */

import { useState, useEffect, useCallback } from 'react'
import './ConflictResolution.css'

const ConflictResolution = ({ onClose }) => {
  const [conflicts, setConflicts] = useState([])
  const [counts, setCounts] = useState({ pending: 0, resolved: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(null)
  const [expandedConflict, setExpandedConflict] = useState(null)
  const [selectedStrategy, setSelectedStrategy] = useState('server-wins')

  const fetchConflicts = useCallback(async () => {
    if (!window.electron?.getPendingConflicts) return

    setLoading(true)
    try {
      const result = await window.electron.getPendingConflicts()
      if (result.success) {
        setConflicts(result.conflicts || [])
        setCounts(result.counts || { pending: 0, resolved: 0, total: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch conflicts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConflicts()
  }, [fetchConflicts])

  const handleResolve = async (conflictId, resolution) => {
    if (!window.electron?.resolveConflict) return

    setResolving(conflictId)
    try {
      const result = await window.electron.resolveConflict(conflictId, resolution, null)
      if (result.success) {
        await fetchConflicts()
      } else {
        alert(`Failed to resolve: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    } finally {
      setResolving(null)
    }
  }

  const handleResolveAll = async (strategy) => {
    if (!window.electron?.resolveAllConflicts) return
    if (!confirm(`Resolve all ${counts.pending} conflicts using "${strategy}" strategy?`)) return

    setResolving('all')
    try {
      const result = await window.electron.resolveAllConflicts(strategy)
      if (result.success) {
        await fetchConflicts()
        alert(`Resolved ${result.resolved} conflicts. ${result.failed} failed.`)
      } else {
        alert(`Failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to resolve all conflicts:', error)
    } finally {
      setResolving(null)
    }
  }

  const handleSetStrategy = async (strategy) => {
    if (!window.electron?.setConflictStrategy) return

    try {
      await window.electron.setConflictStrategy(strategy)
      setSelectedStrategy(strategy)
    } catch (error) {
      console.error('Failed to set strategy:', error)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown'
    return new Date(isoString).toLocaleString()
  }

  const getValueDisplay = (value) => {
    if (value === null || value === undefined) return <span className="null-value">null</span>
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  if (loading) {
    return (
      <div className="conflict-resolution loading">
        <div className="spinner"></div>
        <p>Loading conflicts...</p>
      </div>
    )
  }

  return (
    <div className="conflict-resolution">
      <div className="conflict-header">
        <div className="header-title">
          <h2>Sync Conflicts</h2>
          <div className="conflict-stats">
            <span className="stat pending">{counts.pending} Pending</span>
            <span className="stat resolved">{counts.resolved} Resolved</span>
          </div>
        </div>

        {onClose && (
          <button className="close-btn" onClick={onClose}>X</button>
        )}
      </div>

      {counts.pending > 0 && (
        <div className="bulk-actions">
          <div className="strategy-selector">
            <label>Default Strategy:</label>
            <select
              value={selectedStrategy}
              onChange={(e) => handleSetStrategy(e.target.value)}
            >
              <option value="server-wins">Server Wins</option>
              <option value="client-wins">Client Wins</option>
              <option value="newest-wins">Newest Wins</option>
              <option value="manual">Manual Review</option>
            </select>
          </div>

          <div className="bulk-buttons">
            <button
              className="btn use-server"
              onClick={() => handleResolveAll('use-server')}
              disabled={resolving}
            >
              Use All Server
            </button>
            <button
              className="btn use-local"
              onClick={() => handleResolveAll('use-local')}
              disabled={resolving}
            >
              Use All Local
            </button>
          </div>
        </div>
      )}

      {conflicts.length === 0 ? (
        <div className="no-conflicts">
          <span className="icon">check</span>
          <h3>No Conflicts</h3>
          <p>All data is synchronized between local and server.</p>
        </div>
      ) : (
        <div className="conflicts-list">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`conflict-item ${expandedConflict === conflict.id ? 'expanded' : ''}`}
            >
              <div
                className="conflict-summary"
                onClick={() => setExpandedConflict(
                  expandedConflict === conflict.id ? null : conflict.id
                )}
              >
                <div className="conflict-info">
                  <span className="conflict-icon">!</span>
                  <div className="conflict-details">
                    <span className="record-id">{conflict.recordId}</span>
                    <span className="table-name">{conflict.table}</span>
                    <span className="field-count">
                      {conflict.fieldConflicts?.length || 0} field conflicts
                    </span>
                  </div>
                </div>

                <div className="conflict-meta">
                  <span className="created-at">{formatDate(conflict.createdAt)}</span>
                  <span className={`expand-icon ${expandedConflict === conflict.id ? 'expanded' : ''}`}>
                    v
                  </span>
                </div>
              </div>

              {expandedConflict === conflict.id && (
                <div className="conflict-expanded">
                  <div className="field-conflicts">
                    <table>
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th className="local">Local Value</th>
                          <th className="server">Server Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conflict.fieldConflicts?.map((fc, idx) => (
                          <tr key={idx}>
                            <td className="field-name">{fc.field}</td>
                            <td className="local-value">{getValueDisplay(fc.localValue)}</td>
                            <td className="server-value">{getValueDisplay(fc.serverValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="conflict-actions">
                    <button
                      className="btn use-local"
                      onClick={() => handleResolve(conflict.id, 'use-local')}
                      disabled={resolving === conflict.id}
                    >
                      {resolving === conflict.id ? 'Resolving...' : 'Use Local'}
                    </button>
                    <button
                      className="btn use-server"
                      onClick={() => handleResolve(conflict.id, 'use-server')}
                      disabled={resolving === conflict.id}
                    >
                      {resolving === conflict.id ? 'Resolving...' : 'Use Server'}
                    </button>
                    <button
                      className="btn merge"
                      onClick={() => handleResolve(conflict.id, 'merge')}
                      disabled={resolving === conflict.id}
                      title="Merge: Server values with Local overrides"
                    >
                      {resolving === conflict.id ? 'Resolving...' : 'Merge'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="conflict-footer">
        <button
          className="btn refresh"
          onClick={fetchConflicts}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
    </div>
  )
}

export default ConflictResolution
