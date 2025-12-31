const NotificationSettings = ({
  notificationSettings,
  notificationSaving,
  onToggleNotification,
  onSaveSettings,
  onTestNotification
}) => {
  const Toggle = ({ itemKey, label, icon }) => (
    <div className="settings-list-item">
      <label>{icon} {label}</label>
      <div 
        className={`toggle-switch ${notificationSettings[itemKey] ? 'active' : ''}`}
        onClick={() => onToggleNotification(itemKey)}
      />
    </div>
  )

  return (
    <div className="settings-card">
      <h3>🔔 Notifications</h3>

      <div className="settings-form">
        <div className="settings-list">
          <Toggle itemKey="enabled" label="Enable All" icon="📱" />
          
          {notificationSettings.enabled && (
            <>
              <Toggle itemKey="sound" label="Sound" icon="🔊" />
              <Toggle itemKey="statusChanges" label="Status Changes" icon="🔄" />
              <Toggle itemKey="rejections" label="Rejections" icon="❌" />
              <Toggle itemKey="approvals" label="Approvals" icon="✅" />
              <Toggle itemKey="syncComplete" label="Sync Done" icon="☁️" />
            </>
          )}
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onTestNotification}>
            🔔 Test
          </button>
          <button
            className="save-btn"
            onClick={onSaveSettings}
            disabled={notificationSaving}
          >
            {notificationSaving ? '⏳' : '💾'} Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings
