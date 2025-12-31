import { Button } from '../../../../components/UI'

const UserManagement = ({
  users,
  contractorsList,
  newUser,
  setNewUser,
  userLoading,
  onCreateUser,
  onDeleteUser
}) => {
  return (
    <div className="settings-card">
      <h3>👤 User Management</h3>

      <div className="settings-form">
        {/* Create User - Compact */}
        <div style={{ 
          background: 'rgba(143, 217, 217, 0.05)', 
          padding: '0.75rem', 
          borderRadius: '8px',
          border: '1px solid rgba(143, 217, 217, 0.1)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#8FD9D9', marginBottom: '0.5rem' }}>
            ➕ New User
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value, username: '', contractor_name: '' })}
              >
                <option value="Admin">Admin</option>
                <option value="Management">Management</option>
                <option value="Nokia Engineer">Nokia Engineer</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>

            {newUser.role === 'Contractor' ? (
              <div className="form-group">
                <label>Contractor</label>
                <select
                  value={newUser.contractor_name}
                  onChange={(e) => setNewUser({ ...newUser, contractor_name: e.target.value })}
                >
                  <option value="">Select...</option>
                  {contractorsList.map((c, i) => (
                    <option key={c.name || c || i} value={c.name || c}>
                      {c.name || c}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Username"
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Password"
              />
            </div>
            <Button variant="primary" onClick={onCreateUser} loading={userLoading} size="sm">
              + Add
            </Button>
          </div>
        </div>

        {/* Users List - Compact */}
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
            📋 Users ({users.length})
          </div>
          
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(148,163,184,0.1)'
          }}>
            {users.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                No users
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid rgba(148,163,184,0.06)',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #8FD9D9, #FF8566)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: '#0f172a'
                    }}>
                      {user.username?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                    <div>
                      <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{user.username}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        {user.role} {user.contractor_name && `• ${user.contractor_name}`}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDeleteUser(user.id)}
                    disabled={user.id === 1}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: user.id === 1 ? '#475569' : '#ef4444',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      cursor: user.id === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement
