const ServerModeSettings = ({
  t,
  serverMode,
  serverIP,
  connectedClients,
  serverLoading,
  onToggleServer,
  onCopyIP
}) => {
  return (
    <div className="settings-card">
      <h3>🌐 {t('settings.serverMode', 'Server Mode')}</h3>

      <div className="settings-form">
        <div className="settings-list-item">
          <label>{t('settings.enableServer', 'Enable Server')}</label>
          <div 
            className={`toggle-switch ${serverMode ? 'active' : ''}`}
            onClick={!serverLoading ? onToggleServer : undefined}
            style={{ opacity: serverLoading ? 0.5 : 1 }}
          />
        </div>

        {serverMode && (
          <div className="server-info-compact">
            <div className="quick-stat">
              <span className="status-indicator online" style={{ padding: '0.25rem 0.5rem' }}>
                Running
              </span>
            </div>
            
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>Server IP</label>
              <div className="file-input">
                <input type="text" value={`${serverIP}:3001`} readOnly />
                <button className="btn btn-secondary" onClick={onCopyIP}>📋</button>
              </div>
            </div>

            <div className="quick-stat" style={{ marginTop: '0.5rem' }}>
              <span className="quick-stat-label">👥 Clients:</span>
              <span className="quick-stat-value">{connectedClients}</span>
            </div>
          </div>
        )}

        {serverLoading && (
          <div className="message info">
            ⏳ {serverMode ? 'Stopping...' : 'Starting...'}
          </div>
        )}
      </div>
    </div>
  )
}

export default ServerModeSettings
