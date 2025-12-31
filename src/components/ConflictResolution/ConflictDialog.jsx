import React, { useState } from 'react'

/**
 * ConflictDialog - UI component for resolving data conflicts
 * Shows differences between local and remote versions
 */
export default function ConflictDialog({
  conflict,
  onResolve,
  onCancel,
  isOpen = true
}) {
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [customFields, setCustomFields] = useState({})

  if (!isOpen || !conflict) return null

  const { local, remote, differences = [], key } = conflict

  const handleResolve = (version) => {
    let resolvedData

    if (version === 'local') {
      resolvedData = local
    } else if (version === 'remote') {
      resolvedData = remote
    } else if (version === 'custom') {
      resolvedData = { ...local, ...customFields }
    }

    onResolve({
      key,
      version,
      resolvedData,
      timestamp: new Date().toISOString()
    })
  }

  const handleFieldSelect = (field, source) => {
    const value = source === 'local' ? local[field] : remote[field]
    setCustomFields(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Resolve Conflict</h2>
          <p style={styles.subtitle}>Site ID: <strong>{key}</strong></p>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Summary */}
          <div style={styles.summary}>
            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Differences found:</span>
              <span style={styles.infoValue}>{differences.length}</span>
            </div>
            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Local updated:</span>
              <span style={styles.infoValue}>
                {local?.updated_at ? new Date(local.updated_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Remote updated:</span>
              <span style={styles.infoValue}>
                {remote?.updated_at ? new Date(remote.updated_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Differences Table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Field</th>
                  <th style={{ ...styles.th, ...styles.thLocal }}>Local Value</th>
                  <th style={{ ...styles.th, ...styles.thRemote }}>Remote Value</th>
                  <th style={styles.th}>Choose</th>
                </tr>
              </thead>
              <tbody>
                {differences.map((diff, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{formatFieldName(diff.field)}</strong>
                    </td>
                    <td style={{ ...styles.td, ...styles.tdLocal }}>
                      {formatValue(diff.localValue)}
                    </td>
                    <td style={{ ...styles.td, ...styles.tdRemote }}>
                      {formatValue(diff.remoteValue)}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.chooseButtons}>
                        <button
                          onClick={() => handleFieldSelect(diff.field, 'local')}
                          style={{
                            ...styles.chooseBtn,
                            ...(customFields[diff.field] === diff.localValue ? styles.chooseBtnActive : {})
                          }}
                        >
                          Local
                        </button>
                        <button
                          onClick={() => handleFieldSelect(diff.field, 'remote')}
                          style={{
                            ...styles.chooseBtn,
                            ...(customFields[diff.field] === diff.remoteValue ? styles.chooseBtnActive : {})
                          }}
                        >
                          Remote
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={onCancel} style={styles.cancelBtn}>
            Skip / Decide Later
          </button>
          <div style={styles.actionGroup}>
            <button
              onClick={() => handleResolve('local')}
              style={styles.localBtn}
            >
              Use Local
            </button>
            <button
              onClick={() => handleResolve('remote')}
              style={styles.remoteBtn}
            >
              Use Remote
            </button>
            {Object.keys(customFields).length > 0 && (
              <button
                onClick={() => handleResolve('custom')}
                style={styles.customBtn}
              >
                Use Custom ({Object.keys(customFields).length} fields)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Format field name for display
 */
function formatFieldName(field) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()
}

/**
 * Format value for display
 */
function formatValue(value) {
  if (value === null || value === undefined) return <em style={{ color: '#6b7280' }}>Empty</em>
  if (value === '') return <em style={{ color: '#6b7280' }}>Empty</em>
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  dialog: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #374151'
  },
  title: {
    color: '#f9fafb',
    fontSize: '20px',
    fontWeight: '600',
    margin: 0
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '14px',
    margin: '8px 0 0'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 24px'
  },
  summary: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  infoBox: {
    backgroundColor: '#374151',
    padding: '10px 16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: '12px'
  },
  infoValue: {
    color: '#f9fafb',
    fontSize: '14px',
    fontWeight: '500'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#374151',
    color: '#9ca3af',
    fontWeight: '500',
    borderBottom: '1px solid #4b5563'
  },
  thLocal: {
    backgroundColor: '#1e3a5f'
  },
  thRemote: {
    backgroundColor: '#3f1e1e'
  },
  tr: {
    borderBottom: '1px solid #374151'
  },
  td: {
    padding: '12px',
    color: '#f9fafb',
    verticalAlign: 'top'
  },
  tdLocal: {
    backgroundColor: 'rgba(30, 58, 95, 0.3)'
  },
  tdRemote: {
    backgroundColor: 'rgba(63, 30, 30, 0.3)'
  },
  chooseButtons: {
    display: 'flex',
    gap: '8px'
  },
  chooseBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    border: '1px solid #4b5563',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer'
  },
  chooseBtnActive: {
    backgroundColor: '#8FD9D9',
    color: '#111827',
    borderColor: '#8FD9D9'
  },
  actions: {
    padding: '20px 24px',
    borderTop: '1px solid #374151',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  actionGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  cancelBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    border: '1px solid #4b5563',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer'
  },
  localBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer'
  },
  remoteBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#ef4444',
    color: '#fff',
    cursor: 'pointer'
  },
  customBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#8FD9D9',
    color: '#111827',
    cursor: 'pointer'
  }
}
