const RolePermissions = ({
  permissions,
  permissionsSaving,
  onTogglePermission,
  onSavePermissions
}) => {
  const getRoleIcon = (role) => {
    const icons = { admin: '👑', management: '👔', nokia_engineer: '👷', contractor: '🏗️' }
    return icons[role.toLowerCase()] || '👤'
  }

  const getRoleLabel = (role) => role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  const getPageLabel = (page) => {
    const labels = { clearTssr: 'Clear TSSR', ghirbal: 'Ghirbal' }
    return labels[page] || page.charAt(0).toUpperCase() + page.slice(1)
  }

  return (
    <div className="settings-card">
      <h3>🛡️ Role Permissions</h3>

      <div className="settings-form">
        {Object.keys(permissions).map((role) => (
          <div key={role} style={{ marginBottom: '0.75rem' }}>
            <div style={{ 
              fontSize: '0.85rem', 
              fontWeight: '600', 
              color: '#f1f5f9',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              {getRoleIcon(role)} {getRoleLabel(role)}
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.35rem' 
            }}>
              {Object.keys(permissions[role]).map((page) => (
                <label 
                  key={page}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    background: permissions[role][page] 
                      ? 'rgba(34, 197, 94, 0.15)' 
                      : 'rgba(148,163,184,0.1)',
                    border: `1px solid ${permissions[role][page] ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148,163,184,0.15)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: permissions[role][page] ? '#22c55e' : '#94a3b8',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => onTogglePermission(role, page)}
                >
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    background: permissions[role][page] ? '#22c55e' : 'transparent',
                    border: `1px solid ${permissions[role][page] ? '#22c55e' : '#64748b'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    color: 'white'
                  }}>
                    {permissions[role][page] && '✓'}
                  </span>
                  {getPageLabel(page)}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button
            className="save-btn"
            onClick={onSavePermissions}
            disabled={permissionsSaving}
          >
            {permissionsSaving ? '⏳ Saving...' : '💾 Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RolePermissions
