/**
 * SiteRow Component
 * Table row for Ghirbal sites
 * Extracted from Ghirbal.jsx
 */

import { useState } from 'react'
import { getShortStatus, getStatusClass } from './ghirbalConfig'

const SiteRow = ({ site, isReadOnly, onCheckChange, onSave }) => {
  const [note, setNote] = useState(site.nokia_note || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleCheckChange = async () => {
    if (isReadOnly) return
    onCheckChange(site.site_id, !site.nokia_checked)
  }

  const handleNoteBlur = async () => {
    setIsEditing(false)
    if (note !== (site.nokia_note || '')) {
      await handleSave()
    }
  }

  const handleSave = async () => {
    if (isReadOnly) return
    setIsSaving(true)
    await onSave(site.site_id, site.nokia_checked, note)
    setIsSaving(false)
  }

  return (
    <tr className={`site-row ${site.nokia_checked ? 'site-row--checked' : ''}`}>
      <td className="col-checkbox">
        <label className={`checkbox-wrapper ${isReadOnly ? 'readonly' : ''}`}>
          <input
            type="checkbox"
            checked={site.nokia_checked || false}
            onChange={handleCheckChange}
            disabled={isReadOnly}
          />
          <span className="checkmark">{site.nokia_checked ? '☑' : '☐'}</span>
        </label>
      </td>
      <td className="col-site-id">
        <span className="site-id">{site.site_id}</span>
        {site.final_site_name && (
          <span className="site-name">{site.final_site_name}</span>
        )}
      </td>
      <td className="col-status">
        <span className={`status-badge ${getStatusClass(site.tssr_overall_status)}`}>
          {getShortStatus(site.tssr_overall_status)}
        </span>
      </td>
      <td className="col-contractor">
        {site.tssr_subcon || '—'}
      </td>
      <td className="col-note">
        {isReadOnly ? (
          <span className="note-text">{note || '—'}</span>
        ) : (
          <input
            type="text"
            className="note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={handleNoteBlur}
            placeholder="Add note..."
          />
        )}
      </td>
      <td className="col-actions">
        {!isReadOnly && (
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={isSaving}
            title="Save"
          >
            {isSaving ? '⏳' : '💾'}
          </button>
        )}
        {isReadOnly && site.nokia_updated_by && (
          <span className="updated-by" title={`Updated by: ${site.nokia_updated_by}`}>
            👤
          </span>
        )}
      </td>
    </tr>
  )
}

export default SiteRow
