import { Button } from '../../../../components/UI'

const GeneralSettings = ({
  t,
  formData,
  setFormData,
  phases,
  saving,
  message,
  onSave,
  onSelectFile
}) => {
  return (
    <div className="settings-card">
      <h3>⚙️ {t('settings.general') || 'General Settings'}</h3>

      <div className="settings-form">
        <div className="form-group">
          <label>{t('settings.excelPath') || 'Master Excel File'}</label>
          <div className="file-input">
            <input
              type="text"
              value={formData.excel_path}
              readOnly
              placeholder="Select TSSR Excel file..."
            />
            <Button variant="secondary" onClick={onSelectFile} size="sm">
              📁 Browse
            </Button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('settings.syncInterval') || 'Sync Interval'}</label>
            <select
              value={formData.sync_interval}
              onChange={(e) => setFormData({ ...formData, sync_interval: e.target.value })}
            >
              <option value="1">1 min</option>
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('settings.activePhase') || 'Active Phase'}</label>
            <select
              value={formData.active_phase}
              onChange={(e) => setFormData({ ...formData, active_phase: e.target.value })}
            >
              <option value="ALL">All Phases</option>
              {phases.map((phase) => (
                <option key={phase.phase_name} value={phase.phase_name}>
                  {phase.phase_name} ({phase.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="form-actions">
          <button className="save-btn" onClick={onSave} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GeneralSettings
